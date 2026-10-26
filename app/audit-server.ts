type R=Record<string,any>;
const ready=new WeakMap<object,Promise<void>>();
export async function ensureAudit(db:any){let pending=ready.get(db);if(!pending){pending=initializeAudit(db).catch(error=>{ready.delete(db);throw error});ready.set(db,pending);}await pending;}
async function initializeAudit(db:any){
  // Triggers capture committed record changes in the same transaction, including linked operations.
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS operation_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,event_key TEXT UNIQUE,record_id TEXT NOT NULL,kind TEXT NOT NULL,label TEXT,actor TEXT NOT NULL,actor_name TEXT,occurred_at TEXT NOT NULL,action TEXT NOT NULL,previous_status TEXT,status TEXT,changes TEXT,origin TEXT NOT NULL DEFAULT 'live')`),
    db.prepare('CREATE INDEX IF NOT EXISTS audit_record_time ON operation_audit(record_id,id DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS audit_time ON operation_audit(occurred_at DESC,id DESC)')
  ]);
  const actor=`COALESCE(json_extract(NEW.payload,'$.history[#-1].actor'),json_extract(NEW.payload,'$.updatedBy'),json_extract(NEW.payload,'$.actor'),json_extract(NEW.payload,'$.createdBy'),'sistema')`;
  const insert=(update:boolean)=>`INSERT INTO operation_audit(record_id,kind,label,actor,actor_name,occurred_at,action,previous_status,status,changes) VALUES(NEW.id,NEW.kind,COALESCE(json_extract(NEW.payload,'$.folio'),json_extract(NEW.payload,'$.name'),NEW.id),${update?`CASE WHEN json_extract(NEW.payload,'$.history[#-1]') IS NOT json_extract(OLD.payload,'$.history[#-1]') THEN ${actor} ELSE COALESCE(json_extract(NEW.payload,'$.updatedBy'),'sistema') END`:actor},${update?`CASE WHEN json_extract(NEW.payload,'$.history[#-1]') IS NOT json_extract(OLD.payload,'$.history[#-1]') THEN json_extract(NEW.payload,'$.history[#-1].actorName') END`:`json_extract(NEW.payload,'$.history[#-1].actorName')`},strftime('%Y-%m-%dT%H:%M:%fZ','now'),${update?`CASE WHEN json_extract(NEW.payload,'$.history[#-1]') IS NOT json_extract(OLD.payload,'$.history[#-1]') THEN COALESCE(json_extract(NEW.payload,'$.history[#-1].action'),'Registro actualizado') ELSE 'Registro actualizado' END`:`COALESCE(json_extract(NEW.payload,'$.history[#-1].action'),json_extract(NEW.payload,'$.message'),'Registro creado')`},${update?`json_extract(OLD.payload,'$.status')`:'NULL'},json_extract(NEW.payload,'$.status'),json_extract(NEW.payload,'$.history[#-1].changes'));`;
  await db.batch([
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_record_insert AFTER INSERT ON records BEGIN ${insert(false)} END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_record_update AFTER UPDATE OF payload ON records WHEN NEW.payload IS NOT OLD.payload BEGIN ${insert(true)} END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_record_delete AFTER DELETE ON records BEGIN INSERT INTO operation_audit(record_id,kind,label,actor,occurred_at,action,previous_status) VALUES(OLD.id,OLD.kind,COALESCE(json_extract(OLD.payload,'$.folio'),json_extract(OLD.payload,'$.name'),OLD.id),'sistema',strftime('%Y-%m-%dT%H:%M:%fZ','now'),'Registro retirado',json_extract(OLD.payload,'$.status')); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON operation_audit BEGIN SELECT RAISE(ABORT,'La bitácora es de sólo lectura'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON operation_audit BEGIN SELECT RAISE(ABORT,'La bitácora es de sólo lectura'); END`)
  ]);
  if(await db.prepare("SELECT id FROM records WHERE id='operation-audit-history-v1'").first())return;
  // Recover only the history actually retained by the app; never invent past users or dates.
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO operation_audit(event_key,record_id,kind,label,actor,actor_name,occurred_at,action,previous_status,status,changes,origin) SELECT 'history:'||r.id||':'||j.key,r.id,r.kind,COALESCE(json_extract(r.payload,'$.folio'),json_extract(r.payload,'$.name'),r.id),COALESCE(json_extract(j.value,'$.actor'),'sin registro'),json_extract(j.value,'$.actorName'),json_extract(j.value,'$.date'),COALESCE(json_extract(j.value,'$.action'),'Estado registrado'),json_extract(j.value,'$.previousStatus'),json_extract(j.value,'$.status'),json_extract(j.value,'$.changes'),'history' FROM records r,json_each(r.payload,'$.history') j WHERE json_extract(j.value,'$.date') IS NOT NULL`),
    db.prepare(`INSERT OR IGNORE INTO operation_audit(event_key,record_id,kind,label,actor,occurred_at,action,origin) SELECT 'access:'||id,id,kind,'Administración de accesos',COALESCE(json_extract(payload,'$.actor'),'sin registro'),json_extract(payload,'$.date'),COALESCE(json_extract(payload,'$.message'),'Acceso actualizado'),'history' FROM records WHERE kind='accessAudit' AND json_extract(payload,'$.date') IS NOT NULL`),
    db.prepare("INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES('operation-audit-history-v1','config','{\"name\":\"Bitácora inicializada\"}',1,?)").bind(new Date().toISOString())
  ]);
}
export function auditAccess(profile:R){return ['Administrador','Dirección'].includes(profile.role);}
