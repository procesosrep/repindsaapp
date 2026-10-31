import {randomUUID} from 'node:crypto';
import {folioSpec,folioKey,formatFolio} from './folio-policy.mjs';
export async function nextFolio(db,kind,record={}){
 const spec=folioSpec(kind,record),year=new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'}).slice(0,4);
 const key=spec?folioKey(spec):'project:'+year;
 for(let attempt=0;attempt<1000;attempt++){
  const seq=await db.prepare('INSERT INTO sequences(key,value) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET value=value+1 RETURNING value').bind(key).first();
  const folio=spec?formatFolio(spec,Number(seq.value)):`RP-PR-${year}-${String(seq.value).padStart(5,'0')}`;
  try{await db.prepare('INSERT INTO workflow_links(root,project_id) VALUES(?,?)').bind('reserved-folio:'+folio,randomUUID()).run();return folio}catch(e){if(!/UNIQUE|constraint/i.test(e.message)&&e.code!=='ER_DUP_ENTRY')throw e;}
 }
 throw Error('No se pudo reservar un folio único.');
}
const marker='folio-nomenclature-v2';
export async function migrateFolios(db){
 if(await db.prepare('SELECT name FROM app_migrations WHERE name=?').bind(marker).first())return {renamed:0};
 await db.prepare('CREATE TABLE IF NOT EXISTS folio_rename_backups (id TEXT PRIMARY KEY,payload TEXT NOT NULL,revision INTEGER NOT NULL,updated TEXT NOT NULL)').run();
 const rows=(await db.prepare('SELECT id,kind,payload,revision,updated FROM records ORDER BY updated,id').all()).results;
 const parsed=rows.map(row=>({...row,record:JSON.parse(row.payload)})),now=new Date().toISOString();
 // Reserve every existing new-style identifier before allocating replacements.
 for(const {record:r} of parsed){if(!/^(FR|PR|PO)-(COM|OPE|SUM|RHU|FIN|TRA)-\d{5,}$/.test(r.folio||''))continue;const [prefix,cycle,number]=r.folio.split('-'),key=folioKey({prefix,cycle}),n=Number(number);await db.prepare('INSERT OR IGNORE INTO workflow_links(root,project_id) VALUES(?,?)').bind('reserved-folio:'+r.folio,r.id).run();await db.prepare('INSERT INTO sequences(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=CASE WHEN value<? THEN ? ELSE value END').bind(key,n,n,n).run();}
 const mapping=new Map(),replacement=new Map();
 for(const {record:r}of parsed){if(r.kind==='project'||!r.folio)continue;const spec=folioSpec(r.kind,r),pattern=new RegExp('^'+spec.prefix+'-'+spec.cycle+'-\\d{5,}$');if(pattern.test(r.folio))continue;const next=await nextFolio(db,r.kind,r);if(!mapping.has(r.folio))mapping.set(r.folio,next);replacement.set(r.id,next);}
 const skip=new Set(['body','documentHtml','history','previousFolios','invoiceFolio','uuid','reference','serviceReference','rp']);
 const replace=value=>Array.isArray(value)?value.map(replace):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,skip.has(key)?v:replace(v)])):typeof value==='string'&&mapping.has(value)?mapping.get(value):value;
 const statements=[];
 for(const row of parsed){const r=row.record;let updated=replace(r);if(r.kind==='controlledDocument'&&r.folio)updated.cycleCode=folioSpec(r.kind,r).cycle;if(r.kind==='project'){updated.folio=r.folio;updated.rp=r.rp;updated.serviceReference=r.serviceReference;}if(replacement.has(r.id)){updated.folio=replacement.get(r.id);updated.previousFolios=[...new Set([...(r.previousFolios||[]),r.folio])];updated.history=[...(r.history||[]),{id:randomUUID(),date:now,actor:'sistema',action:'Folio actualizado de '+r.folio+' a '+updated.folio,status:r.status||'Registrado'}];}if(JSON.stringify(updated)===JSON.stringify(r))continue;
  statements.push(db.prepare('INSERT INTO workflow_links(root,project_id) VALUES(?,?)').bind('edit:'+row.id+':'+row.revision,row.id),db.prepare('INSERT OR IGNORE INTO folio_rename_backups(id,payload,revision,updated) VALUES(?,?,?,?)').bind(row.id,row.payload,row.revision,row.updated),db.prepare('UPDATE records SET payload=?,revision=revision+1,updated=? WHERE id=? AND revision=?').bind(JSON.stringify(updated),now,row.id,row.revision));
 }
 statements.push(db.prepare('INSERT INTO app_migrations(name,applied_at) VALUES(?,?)').bind(marker,now));
 // Runs before serving requests. The marker and all record changes commit together.
 try{await db.batch(statements)}catch(e){if(await db.prepare('SELECT name FROM app_migrations WHERE name=?').bind(marker).first())return {renamed:0};throw e;}
 return {renamed:replacement.size};
}
