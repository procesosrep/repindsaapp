import {readdir,readFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {env} from '../server/runtime.mjs';

const migrationsDirectory = fileURLToPath(new URL('../drizzle/', import.meta.url));
export async function migrate() {
  const url = process.env.DATABASE_URL || 'file:./data/repindsa.db';
  // Remote databases need no writable directory inside the application checkout.
  if (url.startsWith('file:') && url !== 'file::memory:') {
    const path = url.startsWith('file:/') ? fileURLToPath(url) : resolve(url.slice(5));
    await mkdir(dirname(path), {recursive:true});
  }
  const db = env.DB;
  await db.prepare('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)').run();
  for (const name of (await readdir(migrationsDirectory)).filter(f => f.endsWith('.sql')).sort()) {
    if (await db.prepare('SELECT name FROM app_migrations WHERE name=?').bind(name).first()) continue;
    const sql = await readFile(resolve(migrationsDirectory, name), 'utf8');
    const stmts = sql.split(';').map(s => s.replace(/--> statement-breakpoint/g,'').trim()).filter(Boolean).map(s => db.prepare(s));
    stmts.push(db.prepare('INSERT INTO app_migrations VALUES(?,?)').bind(name, new Date().toISOString()));
    await db.batch(stmts);
  }
  return db;
}
if (process.argv[1]?.endsWith('/migrate.mjs')) {
  try { await migrate(); console.log('Migraciones aplicadas.'); process.exit(0); }
  catch { console.error('No fue posible aplicar las migraciones. Revisa DATABASE_URL, autenticación, conectividad y permisos de almacenamiento.'); process.exit(1); }
}
