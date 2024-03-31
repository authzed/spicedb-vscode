import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

import { CheckWatchProvider } from './checkwatchprovider';
import { findReferenceNode, parse } from './parsers/dsl/dsl';
import { ResolvedReference, Resolver } from './parsers/dsl/resolution';

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

  // TODO: Move this into the language server.
  vscode.languages.registerDefinitionProvider('spicedb', {
    provideDefinition: function (
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
      const text = document.getText();
      const parserResult = parse(text);
      if (parserResult.error) {
        return;
      }

      // NOTE: the indexes from VSCode are 0-based, but the parser is 1-based.
      const found = findReferenceNode(
        parserResult.schema!,
        position.line + 1,
        position.character + 1
      );
      if (!found) {
        return;
      }

      const resolution = new Resolver(parserResult.schema!);
      switch (found.node?.kind) {
        case 'typeref':
          const def = resolution.lookupDefinition(found.node.path);
          if (def) {
            if (found.node.relationName) {
              const relation = def.lookupRelationOrPermission(
                found.node.relationName
              );
              if (relation) {
                return {
                  uri: document.uri,
                  range: new vscode.Range(
                    relation.range.startIndex.line - 1,
                    relation.range.startIndex.column - 1,
                    relation.range.startIndex.line - 1,
                    relation.range.startIndex.column - 1
                  ),
                };
              }
            } else {
              return {
                uri: document.uri,
                range: new vscode.Range(
                  def.definition.range.startIndex.line - 1,
                  def.definition.range.startIndex.column - 1,
                  def.definition.range.startIndex.line - 1,
                  def.definition.range.startIndex.column - 1
                ),
              };
            }
          }
          break;

        case 'relationref':
          const relation = resolution.resolveRelationOrPermission(
            found.node,
            found.def
          );
          if (relation) {
            return {
              uri: document.uri,
              range: new vscode.Range(
                relation.range.startIndex.line - 1,
                relation.range.startIndex.column - 1,
                relation.range.startIndex.line - 1,
                relation.range.startIndex.column - 1
              ),
            };
          }
          break;
      }

      return undefined;
    },
  });

  // TODO: Move this into the language server.
  vscode.languages.registerDocumentSemanticTokensProvider(
    'spicedb',
    {
      provideDocumentSemanticTokens: function (
        document: vscode.TextDocument,
        token: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.SemanticTokens> {
        const text = document.getText();
        const parserResult = parse(text);
        const data: number[] = [];
        if (parserResult.error) {
          return {
            data: new Uint32Array(data),
            resultId: undefined,
          };
        }

        // Data format:
        // - Line number (0-indexed, and offset from the *previous line*)
        // - Column position (0-indexed)
        // - Token length
        // - Token type index
        // - Modifier index
        let prevLine = 0;
        let prevChar = 0;

        const appendData = (
          lineNumber: number,
          colPosition: number,
          length: number,
          tokenType: number,
          modifierIndex: number
        ) => {
          data.push(
            lineNumber - prevLine,
            prevLine === lineNumber ? colPosition - prevChar : colPosition,
            length,
            tokenType,
            modifierIndex
          );

          prevLine = lineNumber;
          prevChar = colPosition;
        };

        // Resolve all type references and relation/permission references in expressions and color based on their kind and resolution
        // status.
        const resolution = new Resolver(parserResult.schema!);
        resolution
          .resolvedReferences()
          .forEach((resolved: ResolvedReference) => {
            const lineNumber = resolved.reference.range.startIndex.line - 1; // parser ranges are 1-indexed
            const colPosition = resolved.reference.range.startIndex.column - 1;

            switch (resolved.kind) {
              case 'type':
                if (resolved.referencedTypeAndRelation === undefined) {
                  appendData(
                    lineNumber,
                    colPosition,
                    resolved.reference.path.length,
                    /* type.unknown */ 3,
                    0
                  );
                  return;
                }

                appendData(
                  lineNumber,
                  colPosition,
                  resolved.reference.path.length,
                  /* type */ 0,
                  0
                );

                if (resolved.reference.relationName) {
                  if (
                    resolved.referencedTypeAndRelation.relation !== undefined
                  ) {
                    appendData(
                      lineNumber,
                      colPosition + 1 + resolved.reference.path.length,
                      resolved.reference.relationName.length,
                      /* member */ 2,
                      0
                    );
                  } else if (
                    resolved.referencedTypeAndRelation.permission !== undefined
                  ) {
                    appendData(
                      lineNumber,
                      colPosition + 1 + resolved.reference.path.length,
                      resolved.reference.relationName.length,
                      /* property */ 1,
                      0
                    );
                  } else {
                    appendData(
                      lineNumber,
                      colPosition + 1 + resolved.reference.path.length,
                      resolved.reference.relationName.length,
                      /* member.unknown */ 3,
                      0
                    );
                  }
                }
                break;

              case 'expression':
                if (resolved.resolvedRelationOrPermission === undefined) {
                  appendData(
                    lineNumber,
                    colPosition,
                    resolved.reference.relationName.length,
                    /* property.unknown */ 5,
                    0
                  );
                } else {
                  switch (resolved.resolvedRelationOrPermission.kind) {
                    case 'permission':
                      appendData(
                        lineNumber,
                        colPosition,
                        resolved.reference.relationName.length,
                        /* member */ 2,
                        0
                      );
                      break;

                    case 'relation':
                      appendData(
                        lineNumber,
                        colPosition,
                        resolved.reference.relationName.length,
                        /* property */ 1,
                        0
                      );
                      break;
                  }
                }
                break;
            }
          });

        return {
          data: new Uint32Array(data),
          resultId: undefined,
        };
      },
    },
    {
      tokenTypes: [
        'type',
        'property',
        'member',
        'type.unknown',
        'member.unknown',
        'property.unknown',
      ],
      tokenModifiers: ['declaration'],
    }
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
