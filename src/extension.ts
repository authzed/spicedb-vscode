import * as vscode from 'vscode';
import { CheckWatchProvider } from './checkwatchprovider';

export function activate(context: vscode.ExtensionContext) {
  console.log('spicedb-vscode is now active');

  const checkWatchProvider = new CheckWatchProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CheckWatchProvider.viewType,
      checkWatchProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('spicedb.addCheckWatch', () => {
      checkWatchProvider.addWatch();
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        checkWatchProvider.performUpdate(editor.document.uri.fsPath);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      (e: vscode.TextDocumentChangeEvent) => {
        if (e.document.uri.fsPath.endsWith('.zed')) {
          if (
            vscode.window.activeTextEditor?.document.uri.fsPath ===
            e.document.uri.fsPath
          ) {
            checkWatchProvider.setActiveSchema(e.document.getText());
          }
        }

        if (e.document.uri.fsPath.endsWith('.zed.yaml')) {
          if (
            vscode.window.activeTextEditor?.document.uri.fsPath ===
            e.document.uri.fsPath
          ) {
            checkWatchProvider.setActiveYaml(e.document.getText());
          }
        }
      }
    )
  );
}

export function deactivate() {}
