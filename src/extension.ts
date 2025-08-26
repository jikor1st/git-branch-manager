import * as vscode from 'vscode';
import { BranchTreeDataProvider } from './treeDataProvider';
import { BranchManager } from './branchManager';
import { BranchItem } from './branchItem';

let treeDataProvider: BranchTreeDataProvider;
let branchManager: BranchManager;
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

    context.subscriptions.push(
        refresh,
        toggleSelection,
        selectAll,
        deselectAll,
        deleteSelected,
        checkout,
        treeView
    );

    // Initial refresh with slight delay to ensure everything is properly initialized
    setTimeout(() => {
        treeDataProvider.refresh();
    }, 100);
}

export function deactivate() {
    console.log('Git Branch Manager is now deactivated');
}