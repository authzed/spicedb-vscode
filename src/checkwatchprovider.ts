import * as vscode from 'vscode';
import { Uri, Webview } from 'vscode';

import fs from 'fs';
import fsp from 'fs/promises';

function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export class CheckWatchProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'spicedb.checkWatchView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'ready':
          if (
            vscode.window.activeTextEditor?.document.uri.fsPath.endsWith('.zed') ||
            vscode.window.activeTextEditor?.document.uri.fsPath.endsWith('.zed.yaml')
          ) {
            this.performUpdate(vscode.window.activeTextEditor?.document.uri.fsPath);
          }
          break;
      }
    });

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public async performUpdate(fsPath: string) {
    this.setActiveFile(fsPath);

    let schemaContentsPath = '';
    let yamlContentsPath = '';

    if (fsPath.endsWith('.zed')) {
      schemaContentsPath = fsPath;
      yamlContentsPath = fsPath + '.yaml';
    } else if (fsPath.endsWith('.yaml')) {
      yamlContentsPath = fsPath;
      schemaContentsPath = fsPath.replace('.yaml', '');
    }

    let schemaContents = '';
    let yamlContents = '';

    if (schemaContentsPath && fs.existsSync(schemaContentsPath)) {
      try {
        schemaContents = await fsp.readFile(schemaContentsPath, 'utf8');
        this.setActiveSchema(schemaContentsPath, schemaContents);
      } catch (e) {
        console.error(`Error reading schema file at ${schemaContentsPath}:`, e);
        this.setActiveSchema(null, null);
      }
    } else {
      this.setActiveSchema(null, null);
    }

    if (yamlContentsPath && fs.existsSync(yamlContentsPath)) {
      try {
        yamlContents = await fsp.readFile(yamlContentsPath, 'utf8');
        this.setActiveYaml(yamlContentsPath, yamlContents);
      } catch (e) {
        console.error(`Error reading YAML file at ${yamlContentsPath}:`, e);
        this.setActiveYaml(null, null);
      }
    } else {
      this.setActiveYaml(null, null);
    }
  }

  public addWatch() {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ type: 'addWatch' });
    }
  }

  public setActiveFile(filePath: string | undefined) {
    if (this._view) {
      this._view.webview.postMessage({ type: 'activeFile', filePath });
    }
  }

  public setActiveSchema(filename: string | null, schema: string | null) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'schema',
        filename,
        schema,
      });
    }
  }

  public setActiveYaml(filename: string | null, yaml: string | null) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'yaml',
        filename,
        yaml,
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const cssUri = getUri(webview, this._extensionUri, ['src', 'check-watch-panel', 'build', 'main.css']);
    const scriptUri = getUri(webview, this._extensionUri, ['src', 'check-watch-panel', 'build', 'main.js']);
    const goScriptUri = getUri(webview, this._extensionUri, ['src', 'check-watch-panel', 'public', 'wasm_exec.js']);
    const wasmBundleUri = getUri(webview, this._extensionUri, ['src', 'check-watch-panel', 'public', 'main.wasm']);

    // From: https://github.com/microsoft/vscode-extension-samples/blob/main/webview-codicons-sample/src/extension.ts
    const codiconsUri = getUri(webview, this._extensionUri, [
      'src',
      'check-watch-panel',
      'node_modules',
      '@vscode/codicons',
      'dist',
      'codicon.css',
    ]);

    const nonce = getNonce();
    const activeFilePath = vscode.window.activeTextEditor?.document.uri.fsPath ?? '';

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SpiceDB Watches</title>
				<link href="${cssUri}" rel="stylesheet">
				<link href="${codiconsUri}" rel="stylesheet" />
				<script>
					window.WASM_BUNDLE_URI = '${wasmBundleUri}';
					window.ACTIVE_FILE_PATH = '${activeFilePath}';
				</script>
                <script src="${goScriptUri}"></script>
			</head>
			<body>
				<div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
