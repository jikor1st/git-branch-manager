import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class GitWatcher {
    private fileWatchers: vscode.FileSystemWatcher[] = [];
    private lastKnownHead: string | undefined;
    private debounceTimer: NodeJS.Timeout | undefined;
    
    constructor(
        private workspaceRoot: string,
        private onBranchChange: () => void
    ) {}

    start(): void {
        const gitDir = path.join(this.workspaceRoot, '.git');
        
        if (!fs.existsSync(gitDir)) {
            console.log('No .git directory found');
            return;
        }

        // Watch HEAD file for branch switches
        const headWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workspaceRoot, '.git/HEAD')
        );
        
        headWatcher.onDidChange(() => {
            this.handleGitChange('HEAD changed');
        });
        
        headWatcher.onDidCreate(() => {
            this.handleGitChange('HEAD created');
        });
        
        this.fileWatchers.push(headWatcher);

        // Watch refs/heads directory for branch creation/deletion
        const refsWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workspaceRoot, '.git/refs/heads/**')
        );
        
        refsWatcher.onDidChange(() => {
            this.handleGitChange('Branch refs changed');
        });
        
        refsWatcher.onDidCreate(() => {
            this.handleGitChange('New branch created');
        });
        
        refsWatcher.onDidDelete(() => {
            this.handleGitChange('Branch deleted');
        });
        
        this.fileWatchers.push(refsWatcher);

        // Watch packed-refs for branches stored in packed format
        const packedRefsWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workspaceRoot, '.git/packed-refs')
        );
        
        packedRefsWatcher.onDidChange(() => {
            this.handleGitChange('Packed refs changed');
        });
        
        packedRefsWatcher.onDidCreate(() => {
            this.handleGitChange('Packed refs created');
        });
        
        this.fileWatchers.push(packedRefsWatcher);

        // Watch ORIG_HEAD for operations like merge, rebase
        const origHeadWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workspaceRoot, '.git/ORIG_HEAD')
        );
        
        origHeadWatcher.onDidChange(() => {
            this.handleGitChange('ORIG_HEAD changed');
        });
        
        origHeadWatcher.onDidCreate(() => {
            this.handleGitChange('ORIG_HEAD created');
        });
        
        origHeadWatcher.onDidDelete(() => {
            this.handleGitChange('ORIG_HEAD deleted');
        });
        
        this.fileWatchers.push(origHeadWatcher);

        // Store initial HEAD state
        this.updateLastKnownHead();
        
        console.log('Git watcher started');
    }

    private handleGitChange(reason: string): void {
        console.log(`Git change detected: ${reason}`);
        
        // Debounce rapid changes
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            const currentHead = this.getCurrentHead();
            
            // Only trigger if HEAD actually changed or if it's a branch operation
            if (currentHead !== this.lastKnownHead || 
                reason.includes('branch') || 
                reason.includes('refs')) {
                
                this.lastKnownHead = currentHead;
                this.onBranchChange();
            }
        }, 500); // Wait 500ms to batch rapid changes
    }

    private getCurrentHead(): string | undefined {
        try {
            const headPath = path.join(this.workspaceRoot, '.git', 'HEAD');
            if (fs.existsSync(headPath)) {
                return fs.readFileSync(headPath, 'utf8').trim();
            }
        } catch (error) {
            console.error('Error reading HEAD:', error);
        }
        return undefined;
    }

    private updateLastKnownHead(): void {
        this.lastKnownHead = this.getCurrentHead();
    }

    dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.fileWatchers.forEach(watcher => watcher.dispose());
        this.fileWatchers = [];
        
        console.log('Git watcher disposed');
    }
}