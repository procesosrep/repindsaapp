import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {Database} from '../server/runtime.mjs';
import {initializeFreshDatabase, bootstrapAdministrator} from '../server/fresh-install.mjs';
import {pbkdf2Sync} from 'node:crypto';

test('Instalación vacía: sin datos de ejemplo, administrador único y sin resetear contraseñas', async () => {
 const client=createClient({url:'file::memory:'});const db=new Database(client);
 try {
  await db.prepare('CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT,payload TEXT,revision INTEGER,updated TEXT)').run();
  assert.equal(await initializeFreshDatabase(db),true);
  assert.equal(await initializeFreshDatabase(db),false);
  assert.equal((await db.prepare("SELECT * FROM records WHERE kind!='config'").all()).results.length,0);
  assert.equal(await bootstrapAdministrator(db,{}),false);
  await assert.rejects(bootstrapAdministrator(db,{ADMIN_USERNAME:'admin',ADMIN_PASSWORD:'short'}),/Configura ADMIN_USERNAME/);
  const credentials={ADMIN_USERNAME:'Owner',ADMIN_PASSWORD:'Test-only-strong-password',ADMIN_NAME:'Propietario'};
  assert.equal(await bootstrapAdministrator(db,credentials),true);
  const user=await db.prepare("SELECT * FROM material_users WHERE username='owner'").first();
  assert.equal(user.role,'Administrador');assert.equal(user.must_change,1);
  assert.equal(user.hash,pbkdf2Sync(credentials.ADMIN_PASSWORD,user.salt,100000,32,'sha256').toString('hex'));
  assert.equal(JSON.parse((await db.prepare("SELECT payload FROM records WHERE id='system-admin'").first()).payload).userId,'local:owner');
  assert.equal(await bootstrapAdministrator(db,{ADMIN_USERNAME:'other',ADMIN_PASSWORD:'Different-password-123'}),false);
  assert.deepEqual(await db.prepare("SELECT * FROM material_users WHERE username='owner'").first(),user);
  assert.equal((await db.prepare('SELECT * FROM material_users').all()).results.length,1);
 } finally {client.close();}
});

test('Instalación vacía conserva registros existentes',async()=>{
 const client=createClient({url:'file::memory:'});const db=new Database(client);
 try {
  await db.prepare('CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT,payload TEXT,revision INTEGER,updated TEXT)').run();
  await db.prepare("INSERT INTO records VALUES('existing','client','{}',1,'today')").run();
  assert.equal(await initializeFreshDatabase(db),false);
  assert.equal((await db.prepare('SELECT * FROM records').all()).results.length,1);
 } finally {client.close();}
});
