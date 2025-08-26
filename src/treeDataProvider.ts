import * as vscode from 'vscode';
import { BranchItem } from './branchItem';
import { BranchManager } from './branchManager';

export class BranchTreeDataProvider implements vscode.TreeDataProvider<BranchItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BranchItem | undefined | null | void> = new vscode.EventEmitter<BranchItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BranchItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private branchManager: BranchManager,
        private selectedBranches: Set<string>
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BranchItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: BranchItem): Promise<BranchItem[]> {
        if (element) {
            return [];
        }

        // Ensure branchManager is initialized
        if (!this.branchManager.isInitialized()) {
            await this.branchManager.initialize();
            if (!this.branchManager.isInitialized()) {
                return [];
            }
        }

        try {
            const branchesInfo = await this.branchManager.getBranchesWithInfo();
            const currentBranch = await this.branchManager.getCurrentBranch();

            return branchesInfo.map(branchInfo => {
                return BranchItem.createFromBranchName(
                    branchInfo.name,
                    currentBranch,
                    this.selectedBranches,
                    { lastCommitDate: branchInfo.lastCommitDate || new Date() }
                );
            });
        } catch (error) {
            console.error('Failed to get branches:', error);
            vscode.window.showErrorMessage(`Failed to load branches: ${error}`);
            return [];
        }
    }

    getParent(element: BranchItem): vscode.ProviderResult<BranchItem> {
        return null;
    }
}