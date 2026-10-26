import {randomUUID} from 'node:crypto';
// Managed MySQL uses transactional application audit; existing native triggers
// are retained and detected to avoid double entries. No SUPER/TRIGGER required.
export async function initializeMySQLAudit(db) {
  await db.prepare("CREATE TABLE IF NOT EXISTS operation_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,event_key TEXT UNIQUE,record_id TEXT NOT NULL,kind TEXT NOT NULL,label TEXT,actor TEXT NOT NULL,actor_name TEXT,occurred_at TEXT NOT NULL,action TEXT NOT NULL,previous_status TEXT,status TEXT,changes TEXT,origin TEXT NOT NULL DEFAULT 'live')").run();
  await db.prepare('CREATE INDEX IF NOT EXISTS audit_record_time ON operation_audit(record_id,id DESC)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS audit_time ON operation_audit(occurred_at DESC,id DESC)').run();
  // Detect existing native triggers by their transactional effects. This works
  // without TRIGGER/SUPER or access to information_schema.triggers. Roll back
  // the probe, including any native audit entries; no test data is retained.
  const connection=await db.pool.getConnection();
  const id='audit-probe-'+randomUUID();
  const native=new Set();
  try {
    await connection.beginTransaction();
    const count=async()=>Number((await connection.execute('SELECT COUNT(*) AS n FROM operation_audit WHERE record_id=?',[id]))[0][0].n);
    let previous=await count();
    await connection.execute("INSERT INTO records(id,kind,payload,revision,updated) VALUES(?,'config','{}',1,?)",[id,new Date().toISOString()]);
    let next=await count();if(next>previous)native.add('INSERT');previous=next;
    await connection.execute('UPDATE records SET payload=? WHERE id=?',[JSON.stringify({name:'Audit probe'}),id]);
    next=await count();if(next>previous)native.add('UPDATE');previous=next;
    await connection.execute('DELETE FROM records WHERE id=?',[id]);
    if(await count()>previous)native.add('DELETE');
  } finally {
    await connection.rollback();connection.release();
  }
  db.applicationAudit=new Set(['INSERT','UPDATE','DELETE'].filter(operation=>!native.has(operation)));
  const marker=await db.prepare("SELECT payload FROM records WHERE id='operation-audit-history-v1'").first();
  if(marker){
    const payload=JSON.parse(marker.payload);
    if(!payload.id||!payload.kind)await db.prepare("UPDATE records SET payload=? WHERE id='operation-audit-history-v1'").bind(JSON.stringify({...payload,id:'operation-audit-history-v1',kind:'config'})).run();
    return;
  }
  const rows=(await db.prepare('SELECT id,kind,payload FROM records').all()).results;
  const statements=[];
  for(const row of rows) {
    const record=JSON.parse(row.payload);
    for(const [index,event] of (record.history||[]).entries())if(event.date)statements.push(db.prepare('INSERT OR IGNORE INTO operation_audit(event_key,record_id,kind,label,actor,actor_name,occurred_at,action,previous_status,status,changes,origin) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind('history:'+row.id+':'+index,row.id,row.kind,record.folio||record.name||row.id,event.actor||'sin registro',event.actorName||null,event.date,event.action||'Estado registrado',event.previousStatus||null,event.status||null,event.changes==null?null:typeof event.changes==='string'?event.changes:JSON.stringify(event.changes),'history'));
    if(row.kind==='accessAudit'&&record.date)statements.push(db.prepare("INSERT OR IGNORE INTO operation_audit(event_key,record_id,kind,label,actor,occurred_at,action,origin) VALUES(?,?,?,'Administración de accesos',?,?,?,'history')").bind('access:'+row.id,row.id,row.kind,record.actor||'sin registro',record.date,record.message||'Acceso actualizado'));
  }
  statements.push(db.prepare("INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES('operation-audit-history-v1','config','{\"id\":\"operation-audit-history-v1\",\"kind\":\"config\",\"name\":\"Bitácora inicializada\"}',1,?)").bind(new Date().toISOString()));
  for(let i=0;i<statements.length;i+=100)await db.batch(statements.slice(i,i+100));
}
