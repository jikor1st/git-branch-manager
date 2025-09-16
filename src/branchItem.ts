import * as vscode from 'vscode';
import * as path from 'path';

export class BranchItem extends vscode.TreeItem {
    constructor(
        public readonly branchName: string,
        public readonly isCurrentBranch: boolean,
        public readonly isSelected: boolean = false,
        public readonly lastCommitDate?: Date
    ) {
        super(branchName, vscode.TreeItemCollapsibleState.None);
        
        this.updateAppearance();
        this.setupCommand();
    }

    private updateAppearance(): void {
        if (this.isCurrentBranch) {
            this.label = `${this.branchName} (current)`;
            this.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));
            this.description = this.getDescription();
            this.tooltip = `Current branch: ${this.branchName}`;
            this.contextValue = 'currentBranch';
        } else {
            this.label = this.branchName;
            this.iconPath = this.getCheckboxIcon();
            this.description = this.getDescription();
            this.tooltip = this.getTooltip();
            this.contextValue = 'branch';
        }
    }

    private getCheckboxIcon(): vscode.ThemeIcon {
        if (this.isSelected) {
            return new vscode.ThemeIcon('check', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
        }
        return new vscode.ThemeIcon('circle-outline');
    }

    private getDescription(): string {
        if (this.lastCommitDate) {
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - this.lastCommitDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
                const years = Math.floor(diffDays / 365);
                return `${years} year${years > 1 ? 's' : ''} ago`;
            }
        }
        return '';
    }

    private getTooltip(): string {
        const parts = [`Branch: ${this.branchName}`];
        
        if (this.isSelected) {
            parts.push('Status: Selected for deletion');
        }
        
        if (this.lastCommitDate) {
            parts.push(`Last commit: ${this.lastCommitDate.toLocaleDateString()}`);
        }
        
        parts.push('Click to toggle selection');
        
        return parts.join('\n');
    }

    private setupCommand(): void {
        // For non-current branches, clicking toggles selection
        // For current branch, no default action on click
        if (!this.isCurrentBranch) {
            this.command = {
                command: 'gitBranchManager.toggleSelection',
                title: 'Toggle Selection',
                arguments: [this]
            };
        }
    }

    static createFromBranchName(
        branchName: string, 
        currentBranch: string,
        selectedBranches: Set<string>,
        branchInfo?: { lastCommitDate: Date }
    ): BranchItem {
        const isCurrentBranch = branchName === currentBranch;
        const isSelected = selectedBranches.has(branchName);
        
        return new BranchItem(
            branchName,
            isCurrentBranch,
            isSelected,
            branchInfo?.lastCommitDate
        );
    }
}