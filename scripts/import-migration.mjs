import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {migrate} from './migrate.mjs';
import {env} from '../server/runtime.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const quote=s=>'"'+s.replaceAll('"','""')+'"';
export async function importMigration(root=process.env.MIGRATION_DIR||'migration-data'){
 const directory=resolve(root);const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
 const raw=await readFile(resolve(directory,'database.json'));if(digest(raw)!==manifest.databaseSha256)throw Error('El respaldo de base de datos está incompleto o fue modificado.');
 const backup=JSON.parse(raw);if(backup.format!=='repindsa-migration-v1')throw Error('Formato de respaldo inválido.');
 for(const f of manifest.files){const p=resolve(directory,f.file);if(!p.startsWith(directory+sep))throw Error('Ruta de respaldo inválida.');const b=await readFile(p);if(b.length!==f.size||digest(b)!==f.sha256)throw Error('Adjunto incompleto: '+f.key);}
 const db=await migrate();await db.prepare('CREATE TABLE IF NOT EXISTS app_import_state (id TEXT PRIMARY KEY,status TEXT NOT NULL,updated TEXT NOT NULL)').run();
 const previous=await db.prepare('SELECT id,status FROM app_import_state').first();
 if(previous&&previous.id!==manifest.databaseSha256)throw Error('La base pertenece a otro respaldo. Usa una base nueva.');
 if(previous?.status==='complete'){console.log('Este respaldo ya fue importado. No se duplicaron registros.');return;}
 if(!previous){
  const liveTables=(await db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).results;
  for(const t of liveTables){if(['app_migrations','app_import_state'].includes(t.name))continue;const row=await db.prepare('SELECT COUNT(*) n FROM '+quote(t.name)).first();if(Number(row.n)>0)throw Error('La base de destino ya contiene información. No se sobrescribió.');}
  await db.prepare("INSERT INTO app_import_state VALUES(?,'pending',?)").bind(manifest.databaseSha256,new Date().toISOString()).run();
 }
 // Restore objects before activating the database. Existing identical objects are reusable.
 for(const f of manifest.files){const bytes=await readFile(resolve(directory,f.file));const existing=await env.BUCKET.get(f.key);if(existing){const old=new Uint8Array(await new Response(existing.body).arrayBuffer());if(digest(old)!==f.sha256)throw Error('El bucket contiene un archivo distinto con la misma clave: '+f.key);}else await env.BUCKET.put(f.key,bytes);}
 for(const item of backup.schema.filter(x=>x.type==='table'))await db.prepare(item.sql.replace(/^CREATE TABLE\s+(?!IF NOT EXISTS)/i,'CREATE TABLE IF NOT EXISTS ')).run();
 for(const [name,rows] of Object.entries(backup.tables)){
  for(let i=0;i<rows.length;i+=50){await db.batch(rows.slice(i,i+50).map(row=>{const keys=Object.keys(row);return db.prepare('INSERT OR IGNORE INTO '+quote(name)+'('+keys.map(quote).join(',')+') VALUES('+keys.map(()=>'?').join(',')+')').bind(...keys.map(k=>row[k]));}));}
  const stored=(await db.prepare('SELECT * FROM '+quote(name)).all()).results;
  const canonical=row=>JSON.stringify(Object.keys(row).sort().map(k=>[k,row[k]]));
  const expected=rows.map(canonical).sort(),actual=stored.map(canonical).sort();
  if(expected.length!==actual.length||expected.some((x,i)=>x!==actual[i]))throw Error('Verificación de contenido falló en '+name+'. No iniciar el sistema.');
 }
 for(const item of backup.schema.filter(x=>x.type!=='table'))await db.prepare(item.sql.replace(/^CREATE (UNIQUE )?INDEX\s+(?!IF NOT EXISTS)/i,'CREATE $1INDEX IF NOT EXISTS ').replace(/^CREATE TRIGGER\s+(?!IF NOT EXISTS)/i,'CREATE TRIGGER IF NOT EXISTS ')).run();
 await db.prepare("UPDATE app_import_state SET status='complete',updated=? WHERE id=?").bind(new Date().toISOString(),manifest.databaseSha256).run();
 console.log('Migración verificada: usuarios, registros, catálogos, folios, bitácora y '+manifest.files.length+' adjuntos conservados.');
}
if(process.argv[1]?.endsWith('/import-migration.mjs')){try{await importMigration();process.exit(0);}catch(error){console.error(error.message);process.exit(1);}}
