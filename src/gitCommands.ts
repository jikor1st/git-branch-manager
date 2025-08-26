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
}