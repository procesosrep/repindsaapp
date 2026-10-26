import {randomUUID,pbkdf2Sync} from 'node:crypto';
import {migrate} from './migrate.mjs';
import {initializeFreshDatabase} from '../server/fresh-install.mjs';
const username=(process.env.ADMIN_USERNAME||'').toLowerCase(),password=process.env.ADMIN_PASSWORD,name=process.env.ADMIN_NAME||'Administrador';
if(!/^[a-z0-9._-]{3,50}$/.test(username)||!password||password.length<12||password.length>128)throw Error('Define ADMIN_USERNAME y ADMIN_PASSWORD de 12 a 128 caracteres.');
const db=await migrate();if(process.env.MIGRATION_AUTO_IMPORT!=='1')await initializeFreshDatabase(db);await db.prepare('CREATE TABLE IF NOT EXISTS material_users (username TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,must_change INTEGER NOT NULL DEFAULT 1,active INTEGER NOT NULL DEFAULT 1)').run();
if(await db.prepare('SELECT username FROM material_users WHERE username=?').bind(username).first())throw Error('El usuario ya existe. Su contraseña no se modificó.');
const salt=randomUUID(),hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');const owner={id:'system-admin',kind:'config',name,userId:'local:'+username,implementationDate:new Date().toISOString().slice(0,10)};
await db.batch([db.prepare("INSERT INTO material_users(username,name,role,salt,hash,must_change,active) VALUES(?,?,'Administrador',?,?,1,1)").bind(username,name,salt,hash),db.prepare('INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(owner.id,owner.kind,JSON.stringify(owner),new Date().toISOString())]);console.log('Administrador creado. Deberá cambiar su contraseña al ingresar.');process.exit(0);
