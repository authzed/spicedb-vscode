import * as vscode from 'vscode';

import commandExists from 'command-exists';

export async function languageServerBinaryPath(_context: vscode.ExtensionContext): Promise<string | undefined> {
  try {
    return await commandExists('spicedb');
  } catch (_e) {
    return undefined;
  }
}

const INSTALL_COMMANDS = {
  darwin: 'brew install spicedb',
  linux: '',
  win32: '',
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
  return INSTALL_COMMANDS[platform] || 'https://authzed.com/docs/spicedb/getting-started/installing-spicedb';
}
