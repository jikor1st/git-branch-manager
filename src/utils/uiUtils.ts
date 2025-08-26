import * as vscode from 'vscode';

export class UIUtils {
    static showSuccessMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return vscode.window.showInformationMessage(
            `✅ ${message}`,
            ...items
        );
    }

    static showErrorMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return vscode.window.showErrorMessage(
            `❌ ${message}`,
            ...items
        );
    }

    static showWarningMessage(message: string, ...items: string[]): Thenable<string | undefined> {
        return vscode.window.showWarningMessage(
            `⚠️ ${message}`,
            ...items
        );
    }

    static async showQuickPick(
        items: string[],
        options?: vscode.QuickPickOptions
    ): Promise<string | undefined> {
        return vscode.window.showQuickPick(items, options);
    }

    static async showInputBox(
        options?: vscode.InputBoxOptions
    ): Promise<string | undefined> {
        return vscode.window.showInputBox(options);
    }

    static async showProgressNotification<T>(
        title: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
                cancellable: false
            },
            task
        );
    }

    static createStatusBarItem(
        text: string,
        tooltip?: string,
        command?: string
    ): vscode.StatusBarItem {
        const item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        
        item.text = text;
        
        if (tooltip) {
            item.tooltip = tooltip;
        }
        
        if (command) {
            item.command = command;
        }
        
        return item;
    }

    static async showConfirmDialog(
        message: string,
        detail?: string,
        confirmLabel: string = 'Yes',
        cancelLabel: string = 'No'
    ): Promise<boolean> {
        const result = await vscode.window.showInformationMessage(
            message,
            { modal: true, detail },
            confirmLabel,
            cancelLabel
        );
        
        return result === confirmLabel;
    }

    static formatListForDisplay(items: string[], maxItems: number = 5): string {
        if (items.length === 0) {
            return 'None';
        }
        
        if (items.length <= maxItems) {
            return items.join(', ');
        }
        
        const displayed = items.slice(0, maxItems);
        const remaining = items.length - maxItems;
        
        return `${displayed.join(', ')} and ${remaining} more`;
    }

    static createQuickPickItem(
        label: string,
        description?: string,
        detail?: string,
        picked?: boolean
    ): vscode.QuickPickItem {
        return {
            label,
            description,
            detail,
            picked
        };
    }

    static async showMultiSelectQuickPick(
        items: vscode.QuickPickItem[],
        options?: vscode.QuickPickOptions
    ): Promise<vscode.QuickPickItem[] | undefined> {
        const quickPick = vscode.window.createQuickPick();
        
        quickPick.items = items;
        quickPick.canSelectMany = true;
        
        if (options) {
            if (options.placeHolder) {
                quickPick.placeholder = options.placeHolder;
            }
            if (options.title) {
                quickPick.title = options.title;
            }
        }
        
        return new Promise((resolve) => {
            quickPick.onDidAccept(() => {
                resolve(quickPick.selectedItems.slice());
                quickPick.dispose();
            });
            
            quickPick.onDidHide(() => {
                resolve(undefined);
                quickPick.dispose();
            });
            
            quickPick.show();
        });
    }
}