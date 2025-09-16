import * as vscode from 'vscode';
import { GitCommands } from './gitCommands';

export interface BranchInfo {
    name: string;
    isCurrent: boolean;
    lastCommitDate?: Date;
    lastCommitMessage?: string;
    lastCommitAuthor?: string;
}

export class BranchManager {
    private gitCommands: GitCommands;
    private cachedBranches: BranchInfo[] = [];
    private isGitRepo: boolean = false;

    constructor() {
        this.gitCommands = new GitCommands();
    }

    async initialize(): Promise<void> {
        try {
            this.isGitRepo = await this.gitCommands.isGitRepository();
            if (!this.isGitRepo) {
                vscode.window.showWarningMessage('Current workspace is not a Git repository');
            }
        } catch (error) {
            console.error('Failed to initialize BranchManager:', error);
            vscode.window.showErrorMessage('Failed to initialize Git Branch Manager');
        }
    }

    async getCurrentBranch(): Promise<string> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            return await this.gitCommands.getCurrentBranch();
        } catch (error: any) {
            throw new Error(`Failed to get current branch: ${error.message}`);
        }
    }

    async getLocalBranches(): Promise<string[]> {
        if (!this.isGitRepo) {
            return [];
        }

        try {
            return await this.gitCommands.getLocalBranches();
        } catch (error: any) {
            console.error('Failed to get local branches:', error);
            return [];
        }
    }

    async getBranchesWithInfo(): Promise<BranchInfo[]> {
        if (!this.isGitRepo) {
            return [];
        }

        try {
            const branches = await this.getLocalBranches();
            const currentBranch = await this.getCurrentBranch();
            
            const branchInfoPromises = branches.map(async (branchName) => {
                const isCurrent = branchName === currentBranch;
                
                try {
                    const info = await this.gitCommands.getBranchInfo(branchName);
                    return {
                        name: branchName,
                        isCurrent,
                        lastCommitDate: info.lastCommitDate,
                        lastCommitMessage: info.lastCommitMessage,
                        lastCommitAuthor: info.lastCommitAuthor
                    };
                } catch (error) {
                    console.warn(`Failed to get info for branch ${branchName}:`, error);
                    return {
                        name: branchName,
                        isCurrent
                    };
                }
            });

            this.cachedBranches = await Promise.all(branchInfoPromises);
            
            const config = vscode.workspace.getConfiguration('gitBranchManager');
            const sortBy = config.get<string>('sortBy', 'name');
            
            if (sortBy === 'date') {
                this.cachedBranches.sort((a, b) => {
                    if (a.isCurrent) { return -1; }
                    if (b.isCurrent) { return 1; }
                    
                    const dateA = a.lastCommitDate?.getTime() ?? 0;
                    const dateB = b.lastCommitDate?.getTime() ?? 0;
                    return dateB - dateA;
                });
            } else {
                this.cachedBranches.sort((a, b) => {
                    if (a.isCurrent) { return -1; }
                    if (b.isCurrent) { return 1; }
                    return a.name.localeCompare(b.name);
                });
            }

            return this.cachedBranches;
        } catch (error: any) {
            console.error('Failed to get branches with info:', error);
            throw new Error(`Failed to retrieve branch information: ${error.message}`);
        }
    }

    async deleteBranch(branchName: string): Promise<void> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            await this.gitCommands.deleteBranch(branchName);
            this.cachedBranches = this.cachedBranches.filter(b => b.name !== branchName);
        } catch (error: any) {
            throw new Error(`Failed to delete branch '${branchName}': ${error.message}`);
        }
    }

    async deleteBranches(branchNames: string[]): Promise<{ success: string[], failed: string[] }> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        const result = {
            success: [] as string[],
            failed: [] as string[]
        };

        for (const branchName of branchNames) {
            try {
                await this.deleteBranch(branchName);
                result.success.push(branchName);
            } catch (error) {
                console.error(`Failed to delete branch ${branchName}:`, error);
                result.failed.push(branchName);
            }
        }

        return result;
    }

    async checkoutBranch(branchName: string): Promise<void> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        const hasChanges = await this.gitCommands.hasUncommittedChanges();
        
        if (hasChanges) {
            const choice = await vscode.window.showWarningMessage(
                'You have uncommitted changes. What would you like to do?',
                'Stash and Checkout',
                'Cancel'
            );

            if (choice === 'Stash and Checkout') {
                await this.gitCommands.stashChanges();
                vscode.window.showInformationMessage('Changes stashed successfully');
            } else {
                throw new Error('Checkout cancelled due to uncommitted changes');
            }
        }

        try {
            await this.gitCommands.checkoutBranch(branchName);
            
            const branch = this.cachedBranches.find(b => b.name === branchName);
            if (branch) {
                this.cachedBranches.forEach(b => {
                    b.isCurrent = b.name === branchName;
                });
            }
        } catch (error: any) {
            throw new Error(`Failed to checkout branch '${branchName}': ${error.message}`);
        }
    }

    async refreshBranches(): Promise<void> {
        this.cachedBranches = [];
        await this.getBranchesWithInfo();
    }

    getCachedBranches(): BranchInfo[] {
        return this.cachedBranches;
    }

    isInitialized(): boolean {
        return this.isGitRepo;
    }

    async hasRemoteTrackingBranch(branchName: string): Promise<boolean> {
        if (!this.isGitRepo) {
            return false;
        }
        
        try {
            return await this.gitCommands.hasRemoteTrackingBranch(branchName);
        } catch (error) {
            console.error(`Failed to check remote tracking for ${branchName}:`, error);
            return false;
        }
    }

    async pullBranch(branchName?: string): Promise<string> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            return await this.gitCommands.pullBranch(branchName);
        } catch (error: any) {
            throw new Error(`Failed to pull: ${error.message}`);
        }
    }

    async renameBranch(oldName: string, newName: string): Promise<void> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            await this.gitCommands.renameBranch(oldName, newName);
        } catch (error: any) {
            throw new Error(`Failed to rename branch: ${error.message}`);
        }
    }

    async deleteRemoteBranch(branchName: string): Promise<void> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            await this.gitCommands.deleteRemoteBranch(branchName);
        } catch (error: any) {
            throw new Error(`Failed to delete remote branch: ${error.message}`);
        }
    }

    async pushBranch(branchName: string, setUpstream: boolean = false): Promise<void> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            await this.gitCommands.pushBranch(branchName, setUpstream);
        } catch (error: any) {
            throw new Error(`Failed to push branch: ${error.message}`);
        }
    }

    async fetchAll(): Promise<void> {
        if (!this.isGitRepo) {
            throw new Error('Not a Git repository');
        }

        try {
            await this.gitCommands.fetchAll();
        } catch (error: any) {
            throw new Error(`Failed to fetch: ${error.message}`);
        }
    }

    async getBehindAheadCount(branchName: string): Promise<{ behind: number; ahead: number } | null> {
        if (!this.isGitRepo) {
            return null;
        }

        try {
            return await this.gitCommands.getBehindAheadCount(branchName);
        } catch (error) {
            console.error(`Failed to get behind/ahead count for ${branchName}:`, error);
            return null;
        }
    }
}