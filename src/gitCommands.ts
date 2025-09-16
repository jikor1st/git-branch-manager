import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export class GitCommands {
    private workspaceRoot: string;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }
        this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }

    private async executeGitCommand(command: string): Promise<string> {
        try {
            const { stdout, stderr } = await execAsync(command, { 
                cwd: this.workspaceRoot 
            });
            
            if (stderr && !stderr.includes('Switched to branch')) {
                console.warn(`Git command warning: ${stderr}`);
            }
            
            return stdout.trim();
        } catch (error: any) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }

    async isGitRepository(): Promise<boolean> {
        try {
            await this.executeGitCommand('git rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }

    async getCurrentBranch(): Promise<string> {
        const result = await this.executeGitCommand('git branch --show-current');
        if (!result) {
            const branches = await this.executeGitCommand('git branch');
            const currentBranch = branches.split('\n')
                .find(line => line.startsWith('*'));
            if (currentBranch) {
                return currentBranch.replace('* ', '').trim();
            }
            throw new Error('Could not determine current branch');
        }
        return result;
    }

    async getLocalBranches(): Promise<string[]> {
        const result = await this.executeGitCommand('git branch');
        
        if (!result) {
            return [];
        }

        return result
            .split('\n')
            .map(line => line.replace(/^\*?\s+/, '').trim())
            .filter(branch => branch.length > 0);
    }

    async deleteBranch(branchName: string): Promise<void> {
        if (!branchName) {
            throw new Error('Branch name cannot be empty');
        }

        const currentBranch = await this.getCurrentBranch();
        if (branchName === currentBranch) {
            throw new Error('Cannot delete the current branch');
        }

        try {
            await this.executeGitCommand(`git branch -d "${branchName}"`);
        } catch (error: any) {
            if (error.message.includes('not fully merged')) {
                await this.executeGitCommand(`git branch -D "${branchName}"`);
            } else {
                throw error;
            }
        }
    }

    async checkoutBranch(branchName: string): Promise<void> {
        if (!branchName) {
            throw new Error('Branch name cannot be empty');
        }

        await this.executeGitCommand(`git checkout "${branchName}"`);
    }

    async hasUncommittedChanges(): Promise<boolean> {
        const result = await this.executeGitCommand('git status --porcelain');
        return result.length > 0;
    }

    async stashChanges(): Promise<void> {
        await this.executeGitCommand('git stash');
    }

    async getBranchInfo(branchName: string): Promise<{
        lastCommitDate: Date;
        lastCommitMessage: string;
        lastCommitAuthor: string;
    }> {
        const format = '--format=%ai|%s|%an';
        const result = await this.executeGitCommand(
            `git log -1 ${format} "${branchName}"`
        );

        const [date, message, author] = result.split('|');
        
        return {
            lastCommitDate: new Date(date),
            lastCommitMessage: message || '',
            lastCommitAuthor: author || ''
        };
    }

    async getRemoteTrackingBranch(branchName: string): Promise<string | null> {
        try {
            const result = await this.executeGitCommand(
                `git config --get branch.${branchName}.remote`
            );
            if (!result) {
                return null;
            }
            
            const remoteBranch = await this.executeGitCommand(
                `git config --get branch.${branchName}.merge`
            );
            
            if (remoteBranch) {
                // Convert refs/heads/branch-name to remote/branch-name
                const branchRef = remoteBranch.replace('refs/heads/', '');
                return `${result}/${branchRef}`;
            }
            
            return null;
        } catch {
            return null;
        }
    }

    async hasRemoteTrackingBranch(branchName: string): Promise<boolean> {
        const tracking = await this.getRemoteTrackingBranch(branchName);
        return tracking !== null;
    }

    async pullBranch(branchName?: string): Promise<string> {
        let command = 'git pull';
        
        if (branchName) {
            // If specific branch is provided, checkout to it first if needed
            const currentBranch = await this.getCurrentBranch();
            if (currentBranch !== branchName) {
                await this.checkoutBranch(branchName);
            }
        }
        
        try {
            const result = await this.executeGitCommand(command);
            return result || 'Already up to date.';
        } catch (error: any) {
            // Handle specific pull errors
            if (error.message.includes('no tracking information')) {
                throw new Error('No remote tracking branch configured. Please set upstream branch first.');
            } else if (error.message.includes('diverged')) {
                throw new Error('Local and remote branches have diverged. Manual merge required.');
            } else if (error.message.includes('uncommitted changes')) {
                throw new Error('You have uncommitted changes. Please commit or stash them first.');
            }
            throw error;
        }
    }

    async fetchAll(): Promise<void> {
        await this.executeGitCommand('git fetch --all');
    }

    async getBehindAheadCount(branchName: string): Promise<{ behind: number; ahead: number } | null> {
        const trackingBranch = await this.getRemoteTrackingBranch(branchName);
        if (!trackingBranch) {
            return null;
        }

        try {
            // Get behind count
            const behindResult = await this.executeGitCommand(
                `git rev-list --count ${branchName}..${trackingBranch}`
            );
            const behind = parseInt(behindResult) || 0;

            // Get ahead count
            const aheadResult = await this.executeGitCommand(
                `git rev-list --count ${trackingBranch}..${branchName}`
            );
            const ahead = parseInt(aheadResult) || 0;

            return { behind, ahead };
        } catch {
            return null;
        }
    }

    async renameBranch(oldName: string, newName: string): Promise<void> {
        const currentBranch = await this.getCurrentBranch();
        
        if (currentBranch === oldName) {
            // Rename the current branch
            await this.executeGitCommand(`git branch -m "${newName}"`);
        } else {
            // Rename a different branch
            await this.executeGitCommand(`git branch -m "${oldName}" "${newName}"`);
        }
    }

    async deleteRemoteBranch(branchName: string): Promise<void> {
        await this.executeGitCommand(`git push origin --delete "${branchName}"`);
    }

    async pushBranch(branchName: string, setUpstream: boolean = false): Promise<void> {
        if (setUpstream) {
            await this.executeGitCommand(`git push -u origin "${branchName}"`);
        } else {
            await this.executeGitCommand(`git push origin "${branchName}"`);
        }
    }
}