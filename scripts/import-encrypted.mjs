import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createDecipheriv} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {resolve,join,sep} from 'node:path';
import {migrate} from './migrate.mjs';
import {importMigration} from './import-migration.mjs';
export async function importEncryptedMigration(){
 const file=resolve('migration/repindsa-backup.enc');if(!existsSync(file))return false;
 const meta=JSON.parse(await readFile('migration/backup-info.json','utf8'));const db=await migrate();const table=await db.prepare("SELECT name FROM sqlite_schema WHERE name='app_import_state'").first();
 if(table){const state=await db.prepare('SELECT id,status FROM app_import_state').first();if(state?.status==='complete'&&state.id===meta.backupId){console.log('Base inicial ya restaurada. Se conservan los cambios posteriores.');return true;}if(state&&state.id!==meta.backupId)throw Error('La base tiene otro respaldo. No se sobrescribió.');}
 const key=process.env.MIGRATION_IMPORT_KEY;if(!/^[a-f0-9]{64}$/i.test(key||''))throw Error('Configura MIGRATION_IMPORT_KEY en GoDaddy con la clave de instalación entregada por separado.');
 const raw=await readFile(file);if(raw.subarray(0,8).toString()!=='RPENC001')throw Error('Respaldo cifrado inválido.');let bundle;
 try{const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),raw.subarray(8,20));decipher.setAuthTag(raw.subarray(20,36));bundle=JSON.parse(gunzipSync(Buffer.concat([decipher.update(raw.subarray(36)),decipher.final()])).toString());}catch{throw Error('Clave de instalación incorrecta o respaldo incompleto.');}
 if(bundle.manifest?.databaseSha256!==meta.backupId)throw Error('El respaldo no corresponde al paquete.');
 const dir=await mkdtemp(join(tmpdir(),'repindsa-import-'));try{await writeFile(join(dir,'manifest.json'),JSON.stringify(bundle.manifest));await writeFile(join(dir,'database.json'),Buffer.from(bundle.database,'base64'));for(const [name,content] of Object.entries(bundle.files)){const target=resolve(dir,name);if(!target.startsWith(dir+sep))throw Error('Ruta de respaldo inválida.');await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,Buffer.from(content,'base64'));}await importMigration(dir);}finally{await rm(dir,{recursive:true,force:true});}
 return true;
}
if(process.argv[1]?.endsWith('/import-encrypted.mjs')){try{await importEncryptedMigration();process.exit(0);}catch(e){console.error(e.message);process.exit(1);}}
