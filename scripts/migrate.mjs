import {readdir,readFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {env} from '../server/runtime.mjs';

const migrationsDirectory = fileURLToPath(new URL('../drizzle/', import.meta.url));
export async function migrate() {
  const url = process.env.DATABASE_URL || 'file:./data/repindsa.db';
  // Remote databases need no writable directory inside the application checkout.
  if (!process.env.DB_HOST && url.startsWith('file:') && url !== 'file::memory:') {
    const path = url.startsWith('file:/') ? fileURLToPath(url) : resolve(url.slice(5));
    await mkdir(dirname(path), {recursive:true});
  }
  const db = env.DB;
  await db.prepare('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)').run();
  for (const name of (await readdir(migrationsDirectory)).filter(f => f.endsWith('.sql')).sort()) {
    if (await db.prepare('SELECT name FROM app_migrations WHERE name=?').bind(name).first()) continue;
    const sql = await readFile(resolve(migrationsDirectory, name), 'utf8');
    const stmts = sql.split(';').map(s => s.replace(/--> statement-breakpoint/g,'').trim()).filter(Boolean).map(s => db.prepare(s));
    if(db.dialect==='mysql') {
      // DDL commits implicitly in MySQL; mark each version only after success.
      for(const stmt of stmts) {stmt.sql=stmt.sql.replace(/^CREATE TABLE /i,'CREATE TABLE IF NOT EXISTS ').replace(/^CREATE INDEX /i,'CREATE INDEX IF NOT EXISTS ');await stmt.run();}
      await db.prepare('INSERT OR IGNORE INTO app_migrations VALUES(?,?)').bind(name,new Date().toISOString()).run();
    } else {
      stmts.push(db.prepare('INSERT INTO app_migrations VALUES(?,?)').bind(name, new Date().toISOString()));
      await db.batch(stmts);
    }
  }
  if(db.dialect==='mysql'){
    await db.prepare('CREATE TABLE IF NOT EXISTS app_files (file_key VARCHAR(191) PRIMARY KEY,byte_length BIGINT NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS app_file_chunks (file_key VARCHAR(191) NOT NULL,chunk_no INT NOT NULL,content MEDIUMBLOB NOT NULL,PRIMARY KEY(file_key,chunk_no))').run();
  }
  return db;
}
if (process.argv[1]?.endsWith('/migrate.mjs')) {
  try { await migrate(); console.log('Migraciones aplicadas.'); process.exit(0); }
  catch { console.error('No fue posible aplicar las migraciones. Revisa DB_HOST/DB_USER/DB_PASSWORD/DB_NAME (MySQL) o DATABASE_URL (libSQL), conectividad y permisos.'); process.exit(1); }
}
