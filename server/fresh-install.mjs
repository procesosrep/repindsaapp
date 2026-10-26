import {randomUUID, pbkdf2Sync} from 'node:crypto';

// Mark an unused database as a fresh installation; never clear existing records.
export async function initializeFreshDatabase(db) {
  const count = await db.prepare('SELECT COUNT(*) AS n FROM records').first();
  if (Number(count.n) !== 0) return false;
  const now = new Date().toISOString();
  const markers = ['fresh-install-v1', 'seed-lean-catalog-v1', 'seed-crm-won-projects-2026-only-20261023'];
  await db.batch(markers.map(id => db.prepare('INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)')
    .bind(id, 'config', JSON.stringify({id,kind:'config',name:'Instalación nueva sin datos históricos',createdAt:now}), now)));
  return true;
}

// Optional first administrator from private hosting settings. Never reset a user.
export async function bootstrapAdministrator(db, config = process.env) {
  await db.prepare('CREATE TABLE IF NOT EXISTS material_users (username TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,must_change INTEGER NOT NULL DEFAULT 1,active INTEGER NOT NULL DEFAULT 1)').run();
  if (await db.prepare("SELECT id FROM records WHERE id='system-admin'").first() ||
      await db.prepare('SELECT username FROM material_users LIMIT 1').first()) return false;
  if (!config.ADMIN_USERNAME && !config.ADMIN_PASSWORD) return false;
  const username = String(config.ADMIN_USERNAME || '').trim().toLowerCase();
  const password = config.ADMIN_PASSWORD || '';
  if (!/^[a-z0-9._-]{3,50}$/.test(username) || password.length < 12 || password.length > 128) {
    throw Error('Configura ADMIN_USERNAME (3 a 50 caracteres) y ADMIN_PASSWORD (12 a 128 caracteres) para crear el primer administrador.');
  }
  const name = config.ADMIN_NAME || 'Administrador';
  const salt = randomUUID();
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  const now = new Date().toISOString();
  const owner = {id:'system-admin',kind:'config',name,userId:'local:'+username,implementationDate:now.slice(0,10)};
  // The owner insert fails atomically if another process already initialized it.
  await db.batch([
    db.prepare('INSERT INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(owner.id, owner.kind, JSON.stringify(owner), now),
    db.prepare("INSERT INTO material_users(username,name,role,salt,hash,must_change,active) VALUES(?,?,'Administrador',?,?,1,1)").bind(username,name,salt,hash),
  ]);
  return true;
}
