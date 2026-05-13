import * as assert from 'assert';

import { isSpiceDbDocument } from '../spicedbDocument';

suite('isSpiceDbDocument', () => {
  test('accepts a .zed file regardless of language id', () => {
    assert.strictEqual(isSpiceDbDocument('/x/schema.zed', 'plaintext'), true);
  });

  test('accepts a .zed.yaml file regardless of language id', () => {
    assert.strictEqual(isSpiceDbDocument('/x/schema.zed.yaml', 'yaml'), true);
  });

  test('accepts any file whose language id is `spicedb`', () => {
    assert.strictEqual(isSpiceDbDocument('/x/schema.txt', 'spicedb'), true);
  });

  test('rejects an unrelated file even when its path contains `zed`', () => {
    assert.strictEqual(isSpiceDbDocument('/x/notes.md', 'markdown'), false);
    assert.strictEqual(isSpiceDbDocument('/x/zedlike.txt', 'plaintext'), false);
  });
});
