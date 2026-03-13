import * as vscode from 'vscode';

import commandExists from 'command-exists';
import * as fs from 'fs';

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
  darwin: 'brew install spicedb',
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
