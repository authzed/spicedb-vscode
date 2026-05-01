import * as vscode from 'vscode';

import { execFile } from 'child_process';
import commandExists from 'command-exists';
import * as fs from 'fs';
import * as semver from 'semver';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const MIN_SPICEDB_VERSION = '1.52.0';

export async function languageServerBinaryPath(_context: vscode.ExtensionContext): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration('spicedb');
  const customPath = config.get<string>('binaryPath');
  if (customPath) {
    if (fs.existsSync(customPath)) {
      vscode.window.showInformationMessage(`Using custom SpiceDB binary found at configured path: ${customPath}`);
      return customPath;
    }
    vscode.window.showInformationMessage(`Custom SpiceDB binary specified but not found: ${customPath}`);
  }

  try {
    return await commandExists('spicedb');
  } catch (_e) {
    return undefined;
  }
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
