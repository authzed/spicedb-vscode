import * as vscode from 'vscode';

import { execFile } from 'child_process';
import commandExists from 'command-exists';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as semver from 'semver';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const MIN_SPICEDB_VERSION = '1.52.0';

export async function languageServerBinaryPath(_context: vscode.ExtensionContext): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration('spicedb');
  const customPath = config.get<string>('binaryPath');
  if (customPath) {
    let resolvedPath: string | undefined;
    const expandedPath = expandPathVariables(customPath);
    if (path.isAbsolute(expandedPath)) {
      resolvedPath = fs.existsSync(expandedPath) ? expandedPath : undefined;
    } else {
      for (const workspaceFolder of vscode.workspace.workspaceFolders ?? []) {
        const folderPath = workspaceFolder.uri.fsPath;
        const candidatePath = expandPathVariables(customPath, folderPath);
        const joinedPath = path.isAbsolute(candidatePath) ? candidatePath : path.join(folderPath, candidatePath);
        if (fs.existsSync(joinedPath)) {
          resolvedPath = joinedPath;
          break;
        }
      }
    }

    if (resolvedPath) {
      vscode.window.showInformationMessage(`Using custom SpiceDB binary found at configured path: ${customPath}`);
      return resolvedPath;
    }
    vscode.window.showInformationMessage(`Custom SpiceDB binary specified but not found: ${customPath}`);
  }

  try {
    return await commandExists('spicedb');
  } catch (_e) {
    return undefined;
  }
}

export function expandPathVariables(binPath: string, workspaceFolder?: string): string {
  let expanded = binPath.replace(/^~/, os.homedir());
  if (workspaceFolder) {
    expanded = expanded
      .replace(/\$\{workspaceFolder\}|\$\{workspaceRoot\}/g, workspaceFolder)
      .replace(/\$\{workspaceFolderBasename\}/g, path.basename(workspaceFolder));
  }
  return expanded;
}

const INSTALL_COMMANDS = {
  darwin: 'brew install authzed/tap/spicedb',
  linux: '',
  win32: 'choco install spicedb',
  aix: '',
  android: '',
  freebsd: '',
  openbsd: '',
  netbsd: '',
  haiku: '',
  sunos: '',
  cygwin: '',
};

export function getInstallCommand() {
  const platform = process.platform;
  return INSTALL_COMMANDS[platform] || 'https://authzed.com/docs/spicedb/getting-started/install/macos';
}

export async function getSpicedbVersion(binaryPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(binaryPath, ['version']);
    const match = stdout.match(/v?(\d+\.\d+\.\d+)/);
    return match?.[1] ?? '';
  } catch (_e) {
    return '';
  }
}

export function checkSpicedbVersion(binaryPath: string): void {
  void getSpicedbVersion(binaryPath).then((version) => {
    if (!version || !semver.lt(version, MIN_SPICEDB_VERSION)) {
      return;
    }

    const installCommand = getInstallCommand();
    const message = `Installed version of SpiceDB (v${version}) is less than the required (v${MIN_SPICEDB_VERSION}). Please upgrade for full extension support.`;

    if (installCommand.startsWith('https://')) {
      const OpenInstructions = 'Open Upgrade Instructions';
      vscode.window.showWarningMessage(message, OpenInstructions).then((selection) => {
        if (selection === OpenInstructions) {
          vscode.env.openExternal(vscode.Uri.parse(installCommand));
        }
      });
    } else {
      const Upgrade = 'Run Upgrade Command';
      vscode.window.showWarningMessage(`${message} You can upgrade with \`${installCommand}\`.`, Upgrade).then((selection) => {
        if (selection === Upgrade) {
          const terminal = vscode.window.createTerminal('SpiceDB Upgrade');
          terminal.sendText(installCommand);
          terminal.show();
        }
      });
    }
  });
}
