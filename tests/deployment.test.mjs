import test from 'node:test';
import assert from 'node:assert/strict';
import {serverConfig} from '../server/config.mjs';
import {mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

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

test('Migraciones: directorio de trabajo externo, repetición y sin archivos para base en memoria', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'repindsa-migrate-'));
  try {
    const moduleURL = new URL('../scripts/migrate.mjs', import.meta.url).href;
    const runtimeURL = new URL('../server/runtime.mjs', import.meta.url).href;
    const script = `import {migrate} from ${JSON.stringify(moduleURL)};
      import {env} from ${JSON.stringify(runtimeURL)};
      const db=await migrate();
      const before=(await db.prepare('SELECT * FROM app_migrations').all()).results;
      if(!before.length)throw Error('No migrations ran');
      await migrate();
      const after=(await db.prepare('SELECT * FROM app_migrations').all()).results;
      if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Not idempotent');
      env.DB.client.close();`;
    const result = spawnSync(process.execPath, ['--input-type=module','-e',script], {
      cwd, env:{...process.env,DATABASE_URL:'file::memory:',NODE_ENV:'test'}, encoding:'utf8', timeout:15000,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readdir(cwd), []);
  } finally { await rm(cwd, {recursive:true,force:true}); }
});
