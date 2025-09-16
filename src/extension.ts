import * as vscode from 'vscode';
import { BranchTreeDataProvider } from './treeDataProvider';
import { BranchManager } from './branchManager';
import { BranchItem } from './branchItem';
import { GitWatcher } from './gitWatcher';

let treeDataProvider: BranchTreeDataProvider;
let branchManager: BranchManager;
let gitWatcher: GitWatcher | undefined;
const selectedBranches = new Set<string>();

export async function activate(context: vscode.ExtensionContext) {
    console.log('Git Branch Manager is now active!');

    branchManager = new BranchManager();
    await branchManager.initialize();
    
    treeDataProvider = new BranchTreeDataProvider(branchManager, selectedBranches);
    
    vscode.window.registerTreeDataProvider('gitBranchesView', treeDataProvider);
    const treeView = vscode.window.createTreeView('gitBranchesView', {
        treeDataProvider,
        showCollapseAll: false
    });
    

    const refresh = vscode.commands.registerCommand('gitBranchManager.refresh', () => {
        treeDataProvider.refresh();
        vscode.window.showInformationMessage('Branch list refreshed');
    });
    
    const toggleSelection = vscode.commands.registerCommand('gitBranchManager.toggleSelection', (item: BranchItem) => {
        if (item.isCurrentBranch) {
            vscode.window.showWarningMessage('Cannot select the current branch');
            return;
        }
        
        if (selectedBranches.has(item.branchName)) {
            selectedBranches.delete(item.branchName);
        } else {
            selectedBranches.add(item.branchName);
        }
        treeDataProvider.refresh();
    });

    const selectAll = vscode.commands.registerCommand('gitBranchManager.selectAll', async () => {
        const branches = await branchManager.getLocalBranches();
        const currentBranch = await branchManager.getCurrentBranch();
        
        branches.forEach(branch => {
            if (branch !== currentBranch) {
                selectedBranches.add(branch);
            }
        });
        
        treeDataProvider.refresh();
        vscode.window.showInformationMessage('All branches selected (except current)');
    });

    const deselectAll = vscode.commands.registerCommand('gitBranchManager.deselectAll', () => {
        selectedBranches.clear();
        treeDataProvider.refresh();
        vscode.window.showInformationMessage('All branches deselected');
    });

    const deleteSelected = vscode.commands.registerCommand('gitBranchManager.deleteSelected', async () => {
        if (selectedBranches.size === 0) {
            vscode.window.showWarningMessage('No branches selected for deletion');
            return;
        }

        const config = vscode.workspace.getConfiguration('gitBranchManager');
        const confirmBeforeDelete = config.get('confirmBeforeDelete', true);

        if (confirmBeforeDelete) {
            const message = `Are you sure you want to delete ${selectedBranches.size} branch(es)?`;
            const detail = `Branches to delete: ${Array.from(selectedBranches).join(', ')}`;
            
            const result = await vscode.window.showWarningMessage(
                message,
                { modal: true, detail },
                'Delete',
                'Cancel'
            );

            if (result !== 'Delete') {
                return;
            }
        }

        try {
            const branchCount = selectedBranches.size;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Deleting branches...',
                cancellable: false
            }, async (progress) => {
                const branchesArray = Array.from(selectedBranches);
                for (let i = 0; i < branchesArray.length; i++) {
                    const branch = branchesArray[i];
                    progress.report({ 
                        increment: (100 / branchesArray.length),
                        message: `Deleting ${branch}...`
                    });
                    await branchManager.deleteBranch(branch);
                }
            });

            selectedBranches.clear();
            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Successfully deleted ${branchCount} branch(es)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete branches: ${error}`);
        }
    });

    const checkout = vscode.commands.registerCommand('gitBranchManager.checkout', async (item: BranchItem) => {
        if (item.isCurrentBranch) {
            vscode.window.showInformationMessage('Already on this branch');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Checking out branch: ${item.branchName}`,
                cancellable: false
            }, async () => {
                await branchManager.checkoutBranch(item.branchName);
            });

            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Switched to branch: ${item.branchName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to checkout branch: ${error}`);
        }
    });

    // Pull current branch command
    const pullCurrent = vscode.commands.registerCommand('gitBranchManager.pullCurrent', async () => {
        try {
            const currentBranch = await branchManager.getCurrentBranch();
            const hasRemote = await branchManager.hasRemoteTrackingBranch(currentBranch);
            
            if (!hasRemote) {
                vscode.window.showWarningMessage(`Branch '${currentBranch}' has no remote tracking branch`);
                return;
            }

            const result = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Pulling changes for branch: ${currentBranch}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Fetching remote changes...' });
                await branchManager.fetchAll();
                
                progress.report({ message: 'Pulling changes...' });
                return await branchManager.pullBranch();
            });

            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Pull completed: ${result}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to pull: ${error}`);
        }
    });

    // Pull specific branch command
    const pullBranch = vscode.commands.registerCommand('gitBranchManager.pullBranch', async (item: BranchItem) => {
        try {
            const hasRemote = await branchManager.hasRemoteTrackingBranch(item.branchName);
            
            if (!hasRemote) {
                vscode.window.showWarningMessage(`Branch '${item.branchName}' has no remote tracking branch`);
                return;
            }

            const currentBranch = await branchManager.getCurrentBranch();
            const needsCheckout = currentBranch !== item.branchName;

            const result = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Pulling changes for branch: ${item.branchName}`,
                cancellable: false
            }, async (progress) => {
                if (needsCheckout) {
                    progress.report({ message: 'Checking out branch...' });
                }
                
                progress.report({ message: 'Fetching remote changes...' });
                await branchManager.fetchAll();
                
                progress.report({ message: 'Pulling changes...' });
                const pullResult = await branchManager.pullBranch(item.branchName);
                
                if (needsCheckout) {
                    progress.report({ message: 'Returning to original branch...' });
                    await branchManager.checkoutBranch(currentBranch);
                }
                
                return pullResult;
            });

            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Pull completed for '${item.branchName}': ${result}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to pull branch '${item.branchName}': ${error}`);
        }
    });

    // Show branch menu command
    const showBranchMenu = vscode.commands.registerCommand('gitBranchManager.showBranchMenu', async (item: BranchItem) => {
        const options = [];
        
        // Toggle selection option (for non-current branches)
        if (!item.isCurrentBranch) {
            if (selectedBranches.has(item.branchName)) {
                options.push({
                    label: '$(close) Deselect',
                    description: 'Remove from deletion list',
                    action: 'deselect'
                });
            } else {
                options.push({
                    label: '$(check) Select for Deletion',
                    description: 'Mark for deletion',
                    action: 'select'
                });
            }
        }
        
        // Checkout option (for non-current branches)
        if (!item.isCurrentBranch) {
            options.push({
                label: '$(git-branch) Checkout',
                description: 'Switch to this branch',
                action: 'checkout'
            });
        }
        
        // Pull option (if has remote)
        const hasRemote = await branchManager.hasRemoteTrackingBranch(item.branchName);
        if (hasRemote) {
            options.push({
                label: '$(sync) Pull',
                description: 'Pull latest changes from remote',
                action: 'pull'
            });
        }
        
        // Rename option
        options.push({
            label: '$(edit) Rename',
            description: 'Rename this branch',
            action: 'rename'
        });
        
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: `Branch actions for ${item.branchName}`
        });
        
        if (selected) {
            switch (selected.action) {
                case 'select':
                    selectedBranches.add(item.branchName);
                    treeDataProvider.refresh();
                    break;
                case 'deselect':
                    selectedBranches.delete(item.branchName);
                    treeDataProvider.refresh();
                    break;
                case 'checkout':
                    vscode.commands.executeCommand('gitBranchManager.checkout', item);
                    break;
                case 'pull':
                    vscode.commands.executeCommand('gitBranchManager.pullBranch', item);
                    break;
                case 'rename':
                    vscode.commands.executeCommand('gitBranchManager.renameBranch', item);
                    break;
            }
        }
    });

    // Rename branch command
    const renameBranch = vscode.commands.registerCommand('gitBranchManager.renameBranch', async (item: BranchItem) => {
        const newName = await vscode.window.showInputBox({
            prompt: `Enter new name for branch '${item.branchName}'`,
            value: item.branchName,
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Branch name cannot be empty';
                }
                if (value.includes(' ')) {
                    return 'Branch name cannot contain spaces';
                }
                return null;
            }
        });

        if (!newName || newName === item.branchName) {
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Renaming branch '${item.branchName}' to '${newName}'`,
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Renaming branch locally...' });
                await branchManager.renameBranch(item.branchName, newName);
                
                // Check if the branch has a remote
                const hasRemote = await branchManager.hasRemoteTrackingBranch(item.branchName);
                if (hasRemote) {
                    const pushChoice = await vscode.window.showInformationMessage(
                        `Branch renamed locally. Do you want to push the rename to remote?`,
                        'Yes, push to remote',
                        'No, keep local only'
                    );
                    
                    if (pushChoice === 'Yes, push to remote') {
                        progress.report({ message: 'Updating remote...' });
                        // Delete old remote branch and push new one
                        await branchManager.deleteRemoteBranch(item.branchName);
                        await branchManager.pushBranch(newName, true);
                    }
                }
            });

            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Branch renamed from '${item.branchName}' to '${newName}'`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to rename branch: ${error}`);
        }
    });

    // Set up Git watcher for real-time updates
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        gitWatcher = new GitWatcher(
            workspaceFolders[0].uri.fsPath,
            () => {
                console.log('Branch change detected, refreshing tree view');
                // Clear selections when branches change externally
                selectedBranches.clear();
                treeDataProvider.refresh();
            }
        );
        gitWatcher.start();
        
        context.subscriptions.push({
            dispose: () => {
                if (gitWatcher) {
                    gitWatcher.dispose();
                }
            }
        });
    }

    context.subscriptions.push(
        refresh,
        toggleSelection,
        selectAll,
        deselectAll,
        deleteSelected,
        checkout,
        pullCurrent,
        pullBranch,
        showBranchMenu,
        renameBranch,
        treeView
    );

    // Initial refresh with slight delay to ensure everything is properly initialized
    setTimeout(() => {
        treeDataProvider.refresh();
    }, 100);
}

export function deactivate() {
    console.log('Git Branch Manager is now deactivated');
    if (gitWatcher) {
        gitWatcher.dispose();
    }
}