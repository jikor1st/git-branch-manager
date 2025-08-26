import * as vscode from 'vscode';

export class GitUtils {
    static sanitizeBranchName(branchName: string): string {
        return branchName
            .replace(/[^a-zA-Z0-9\-_\/]/g, '')
            .replace(/\/+/g, '/')
            .replace(/^\/|\/$/g, '');
    }

    static isValidBranchName(branchName: string): boolean {
        if (!branchName || branchName.trim().length === 0) {
            return false;
        }

        const invalidPatterns = [
            /^\./, 
            /\.\.$/, 
            /\.lock$/, 
            /[\s~^:?*\[\\]/,
            /@\{/, 
            /\/\//, 
            /^\//, 
            /\/$/ 
        ];

        return !invalidPatterns.some(pattern => pattern.test(branchName));
    }

    static formatGitError(error: any): string {
        const errorMessage = error.message || error.toString();

        const errorMappings: { [key: string]: string } = {
            'not fully merged': 'Branch has unmerged changes. Use force delete if you\'re sure.',
            'cannot delete branch': 'Cannot delete the current branch. Please switch to another branch first.',
            'not a git repository': 'Current folder is not a Git repository.',
            'pathspec': 'Branch not found. It may have already been deleted.',
            'uncommitted changes': 'You have uncommitted changes. Please commit or stash them first.',
            'permission denied': 'Permission denied. Check your repository permissions.',
            'no such file or directory': 'Git command not found. Please ensure Git is installed.',
        };

        for (const [key, message] of Object.entries(errorMappings)) {
            if (errorMessage.toLowerCase().includes(key)) {
                return message;
            }
        }

        return errorMessage;
    }

    static async findGitRoot(startPath: string): Promise<string | undefined> {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            const { stdout } = await execAsync('git rev-parse --show-toplevel', {
                cwd: startPath
            });
            return stdout.trim();
        } catch {
            return undefined;
        }
    }

    static parseGitBranchOutput(output: string): string[] {
        return output
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                if (line.startsWith('* ')) {
                    return line.substring(2);
                }
                return line;
            });
    }

    static async confirmDangerousOperation(
        message: string,
        detail?: string
    ): Promise<boolean> {
        const result = await vscode.window.showWarningMessage(
            message,
            {
                modal: true,
                detail: detail
            },
            'Yes',
            'No'
        );

        return result === 'Yes';
    }

    static groupBranchesByPrefix(branches: string[]): Map<string, string[]> {
        const grouped = new Map<string, string[]>();

        for (const branch of branches) {
            const parts = branch.split('/');
            const prefix = parts.length > 1 ? parts[0] : 'other';
            
            if (!grouped.has(prefix)) {
                grouped.set(prefix, []);
            }
            
            grouped.get(prefix)!.push(branch);
        }

        return grouped;
    }
}