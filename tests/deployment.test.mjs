import test from 'node:test';
import assert from 'node:assert/strict';
import {serverConfig} from '../server/config.mjs';

test('Hosting: puerto interno independiente del origen HTTPS', () => {
  const config = serverConfig({PORT:'8080', APP_ORIGIN:'https://repindsa.example'}, false);
  assert.equal(config.port, 8080);
  assert.equal(config.origin.origin, 'https://repindsa.example');
  for (const PORT of ['0', '-1', '65536', 'abc', '3.5']) {
    assert.throws(() => serverConfig({PORT}, true), /PORT/);
  }
  for (const APP_ORIGIN of ['', 'http://example.com', 'https://example.com/path', 'https://user:pass@example.com', 'https://example.com?x=1']) {
    assert.throws(() => serverConfig({APP_ORIGIN}, false));
  }
  assert.equal(serverConfig({}, true).port, 3000);
});

