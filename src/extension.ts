import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

import { CheckWatchProvider } from './checkwatchprovider';

export function activate(context: vscode.ExtensionContext) {
  console.log('spicedb-vscode is now active');

  const checkWatchProvider = new CheckWatchProvider(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(CheckWatchProvider.viewType, checkWatchProvider));

  context.subscriptions.push(
    vscode.commands.registerCommand('spicedb.addCheckWatch', () => {
      checkWatchProvider.addWatch();
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        checkWatchProvider.performUpdate(editor.document.uri.fsPath);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
      if (e.document.uri.fsPath.endsWith('.zed')) {
        if (vscode.window.activeTextEditor?.document.uri.fsPath === e.document.uri.fsPath) {
          checkWatchProvider.setActiveSchema(e.document.getText());
        }
      }

      if (e.document.uri.fsPath.endsWith('.zed.yaml')) {
        if (vscode.window.activeTextEditor?.document.uri.fsPath === e.document.uri.fsPath) {
          checkWatchProvider.setActiveYaml(e.document.getText());
        }
      }
    }),
  );

  startLanguageServer();
}

async function startLanguageServer() {
  // Start the LSP hooks using the language server found in the SpiceDB binary.
  const serverBinary = 'spicedb';

  const serverOptions: ServerOptions = {
    run: {
      command: serverBinary,
      args: ['lsp'],
      transport: TransportKind.stdio,
    },
    debug: {
      command: serverBinary,
      args: ['lsp'],
      transport: TransportKind.stdio,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'spicedb' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.zed'),
    },
  };

  // Create the language client and start the client.
  const client = new LanguageClient('spicedbLanguageServer', 'SpiceDB Language Server', serverOptions, clientOptions);

  // Start the client. This will also launch the server.
  await client.start();
  console.log('spicedb-vscode is now active with its LSP running');
}

export function deactivate() {}
