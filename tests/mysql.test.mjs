import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID, randomBytes} from 'node:crypto';
import {MySQLDatabase, MySQLBucket, mysqlSQL} from '../server/mysql.mjs';
import {initializeMySQLAudit} from '../server/mysql-audit.mjs';
import mysql from 'mysql2/promise';
import {recordIdentity} from '../server/mysql-record-audit.mjs';

test('MySQL traduce palabras reservadas sin modificar literales',()=>{
 assert.match(mysqlSQL('CREATE TABLE sequences (key TEXT PRIMARY KEY,value INTEGER)'),/`key` VARCHAR\(191\) PRIMARY KEY/);
 assert.match(mysqlSQL("INSERT INTO sequences(key,value) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET value=value+1"),/ON DUPLICATE KEY UPDATE `value`=`value`\+1/);
 assert.match(mysqlSQL("SELECT json_extract(payload,'$.key') FROM records"),/'\$\.key'/);
 assert.equal(recordIdentity('UPDATE records SET payload=?,updated=? WHERE id=? AND revision=?',['{}','today','target',1]),'target');
 assert.equal(recordIdentity("INSERT INTO records(id,kind,payload) VALUES('fixed','config',?)",['{}']),'fixed');
 assert.throws(()=>recordIdentity('UPDATE records SET payload=?',['{}']),/ID/);
});

test('MySQL real: lotes atómicos, folios concurrentes, auditoría y adjuntos persistentes', {skip:!process.env.MYSQL_TEST_HOST}, async()=>{
 const name='repindsa_test_'+randomUUID().replaceAll('-','');
 const config={host:process.env.MYSQL_TEST_HOST,port:Number(process.env.MYSQL_TEST_PORT||3306),user:process.env.MYSQL_TEST_USER||'root',password:process.env.MYSQL_TEST_PASSWORD||'',connectionLimit:5};
 const admin=await mysql.createConnection(config);await admin.query('CREATE DATABASE `'+name+'`');
 const pool=mysql.createPool({...config,database:name});const db=new MySQLDatabase(pool);
 try {
  await db.prepare('CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL,revision INTEGER DEFAULT 1 NOT NULL,updated TEXT NOT NULL)').run();
  await db.prepare('CREATE TABLE sequences(key TEXT PRIMARY KEY,value INTEGER NOT NULL)').run();
  await db.prepare('CREATE TABLE material_login_limits(key TEXT PRIMARY KEY,attempts INTEGER NOT NULL)').run();
  await db.prepare('CREATE TABLE workspace_sessions(token_hash TEXT PRIMARY KEY,system TEXT NOT NULL)').run();
  await db.prepare('INSERT INTO workspace_sessions(token_hash,system) VALUES(?,?)').bind('test','operaciones').run();
  assert.equal((await db.prepare('SELECT system FROM workspace_sessions WHERE token_hash=?').bind('test').first()).system,'operaciones');
  await db.prepare('CREATE TABLE material_catalog_v2(id TEXT PRIMARY KEY,payload TEXT NOT NULL)').run();
  await db.prepare("INSERT OR IGNORE INTO material_catalog_v2(id,payload) SELECT json_extract(value,'$.id'),value FROM json_each(?)").bind(JSON.stringify([{id:'one',name:'Artículo de prueba'}])).run();
  assert.equal(JSON.parse((await db.prepare("SELECT payload FROM material_catalog_v2 WHERE id='one'").first()).payload).name,'Artículo de prueba');
  await db.prepare("INSERT OR IGNORE INTO material_catalog_v2(id,payload) SELECT json_extract(value,'$.id'),value FROM json_each(?)").bind(JSON.stringify([{id:'one',name:'Replacement must not overwrite'},{id:'two',name:'Second'}])).run();
  assert.equal(JSON.parse((await db.prepare("SELECT payload FROM material_catalog_v2 WHERE id='one'").first()).payload).name,'Artículo de prueba');
  assert.equal(Number(await db.prepare('SELECT COUNT(*) AS n FROM material_catalog_v2').first('n')),2);
  await db.prepare('CREATE TABLE app_files(file_key VARCHAR(191) PRIMARY KEY,byte_length BIGINT NOT NULL)').run();
  await db.prepare('CREATE TABLE app_file_chunks(file_key VARCHAR(191),chunk_no INT,content MEDIUMBLOB,PRIMARY KEY(file_key,chunk_no))').run();
  await initializeMySQLAudit(db);await initializeMySQLAudit(db);
  const counters=await Promise.all(Array.from({length:20},()=>db.prepare('INSERT INTO sequences(key,value) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET value=value+1 RETURNING value').bind('folio').first('value')));
  assert.deepEqual(counters.map(Number).sort((a,b)=>a-b),Array.from({length:20},(_,i)=>i+1));
  const rate=()=>db.prepare('INSERT INTO material_login_limits(key,attempts) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind('ip:test').first('attempts');
  assert.equal(Number(await rate()),1);assert.equal(Number(await rate()),2);
  const insert=id=>db.prepare('INSERT INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(id,'client',JSON.stringify({name:'Cliente',status:'Activo',history:[{actor:'usuario:owner',actorName:'Propietario',action:'Creado'}]}),'today');
  await insert('client').run();
  assert.equal((await db.prepare("SELECT actor_name FROM operation_audit WHERE record_id='client'").first()).actor_name,'Propietario');
  await assert.rejects(db.batch([insert('rollback'),insert('client')]));
  assert.equal(await db.prepare("SELECT id FROM records WHERE id='rollback'").first(),null);
  assert.equal(await db.prepare("SELECT id FROM operation_audit WHERE record_id='rollback'").first(),null);
  await db.prepare('UPDATE records SET payload=?,revision=revision+1 WHERE id=?').bind(JSON.stringify({name:'Actualizado',status:'Inactivo',updatedBy:'usuario:editor'}),'client').run();
  const audit=await db.prepare("SELECT * FROM operation_audit WHERE record_id='client' ORDER BY id DESC").first();
  assert.equal(audit.actor,'usuario:editor');assert.equal(audit.previous_status,'Activo');assert.equal(audit.status,'Inactivo');
  await assert.rejects(db.prepare('DELETE FROM operation_audit').run(),/sólo lectura/);
  await assert.rejects(db.prepare("UPDATE operation_audit SET action='forged'").run(),/sólo lectura/);
  assert.equal((await db.prepare("INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES('client','client','{}',1,'today')").run()).meta.changes,0);
  const bytes=randomBytes(700000);const bucket=new MySQLBucket(db);await bucket.put('files/test.bin',bytes);
  const reconnected=new MySQLBucket(new MySQLDatabase(pool));assert.deepEqual(Buffer.from((await reconnected.get('files/test.bin')).body),bytes);
  await bucket.put('files/test.bin',new Uint8Array([1,2,3]));assert.deepEqual(Array.from((await bucket.get('files/test.bin')).body),[1,2,3]);
  await bucket.delete('files/test.bin');assert.equal(await bucket.get('files/test.bin'),null);
  // Retain old database triggers without creating duplicate application events.
  await pool.query("CREATE TRIGGER legacy_insert AFTER INSERT ON records FOR EACH ROW INSERT INTO operation_audit(record_id,kind,actor,occurred_at,action) VALUES(NEW.id,NEW.kind,'legacy','today','Legacy insert')");
  await initializeMySQLAudit(db);
  assert.equal(db.applicationAudit.has('INSERT'),false);
  await insert('native').run();
  assert.equal(Number(await db.prepare("SELECT COUNT(*) AS n FROM operation_audit WHERE record_id='native'").first('n')),1);
 } finally {await pool.end();await admin.query('DROP DATABASE `'+name+'`');await admin.end();}
});

test('MySQL administrado: bitácora transaccional sin permisos TRIGGER ni SUPER', {skip:!process.env.MYSQL_TEST_HOST}, async()=>{
 const suffix=randomUUID().replaceAll('-','');const name='repindsa_test_'+suffix;
 const user='repindsa_'+suffix.slice(0,16);const password=randomBytes(24).toString('hex');
 const admin=await mysql.createConnection({host:process.env.MYSQL_TEST_HOST,port:Number(process.env.MYSQL_TEST_PORT||3306),user:process.env.MYSQL_TEST_USER||'root',password:process.env.MYSQL_TEST_PASSWORD||''});
 let pool;
 try {
  await admin.query('CREATE DATABASE `'+name+'`');
  await admin.query('CREATE USER ?@\'%\' IDENTIFIED BY ?',[user,password]);
  await admin.query('GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX ON `'+name+'`.* TO ?@\'%\'',[user]);
  pool=mysql.createPool({host:process.env.MYSQL_TEST_HOST,port:Number(process.env.MYSQL_TEST_PORT||3306),user,password,database:name});
  const db=new MySQLDatabase(pool);
  await db.prepare('CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT,payload TEXT,revision INTEGER,updated TEXT)').run();
  await initializeMySQLAudit(db);
  assert.equal(db.applicationAudit.size,3);
  const insert=id=>db.prepare('INSERT INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(id,'client',JSON.stringify({name:'Cliente',actor:'usuario:owner'}),'today');
  await insert('limited').run();
  assert.equal((await db.prepare("SELECT actor FROM operation_audit WHERE record_id='limited'").first()).actor,'usuario:owner');
  await assert.rejects(db.batch([insert('rollback'),insert('limited')]));
  assert.equal(await db.prepare("SELECT id FROM operation_audit WHERE record_id='rollback'").first(),null);
  assert.equal(await db.prepare("SELECT id FROM records WHERE id='rollback'").first(),null);
  await assert.rejects(db.prepare('DELETE FROM operation_audit').run(),/sólo lectura/);
  await assert.rejects(db.prepare('UPDATE operation_audit SET action=?').bind('forged').run(),/sólo lectura/);
  assert.equal(Number(await db.prepare("SELECT COUNT(*) AS n FROM records WHERE id LIKE 'audit-probe-%'").first('n')),0);
  assert.equal(Number(await db.prepare("SELECT COUNT(*) AS n FROM operation_audit WHERE record_id LIKE 'audit-probe-%'").first('n')),0);
  const [triggers]=await admin.execute('SELECT 1 FROM information_schema.triggers WHERE TRIGGER_SCHEMA=?',[name]);assert.equal(triggers.length,0);
 } finally {
  if(pool)await pool.end();
  await admin.query('DROP DATABASE IF EXISTS `'+name+'`');
  await admin.query('DROP USER IF EXISTS ?@\'%\'',[user]);await admin.end();
 }
});
