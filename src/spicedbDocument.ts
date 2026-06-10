// isSpiceDbDocument reports whether a document represents a SpiceDB-related
// file the check-watch panel knows how to render: a `.zed` schema, a
// `.zed.yaml` relationships file, or any file the user has tagged with the
// `spicedb` language id. Kept as a pure predicate over its inputs so it can
// be unit-tested without standing up the VS Code test harness.
export function isSpiceDbDocument(fsPath: string, languageId: string): boolean {
  return fsPath.endsWith('.zed') || fsPath.endsWith('.zed.yaml') || languageId === 'spicedb';
}
