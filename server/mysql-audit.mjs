// Native MySQL triggers preserve audit entries in the same InnoDB transaction.
export async function initializeMySQLAudit(db) {
  await db.prepare("CREATE TABLE IF NOT EXISTS operation_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,event_key TEXT UNIQUE,record_id TEXT NOT NULL,kind TEXT NOT NULL,label TEXT,actor TEXT NOT NULL,actor_name TEXT,occurred_at TEXT NOT NULL,action TEXT NOT NULL,previous_status TEXT,status TEXT,changes TEXT,origin TEXT NOT NULL DEFAULT 'live')").run();
  await db.prepare('CREATE INDEX IF NOT EXISTS audit_record_time ON operation_audit(record_id,id DESC)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS audit_time ON operation_audit(occurred_at DESC,id DESC)').run();
  const connection=await db.pool.getConnection();
  // Serialize trigger installation across preview/production processes sharing DB.
  let locked=false;
  try {
    const [locks]=await connection.query("SELECT GET_LOCK(CONCAT(LEFT(DATABASE(),40),':repindsa-audit'),30) AS acquired");
    if(Number(locks[0].acquired)!==1)throw Error('No fue posible inicializar la bitácora.');
    locked=true;
    const json=(row,path)=>`JSON_UNQUOTE(JSON_EXTRACT(${row}.payload,'${path}'))`;
    const time="DATE_FORMAT(UTC_TIMESTAMP(3),'%Y-%m-%dT%H:%i:%s.%fZ')";
    for(const operation of ['INSERT','UPDATE','DELETE']) {
      const row=operation==='DELETE'?'OLD':'NEW';
      const changed=operation==='UPDATE'?`NOT (${json('NEW','$.history[last]')} <=> ${json('OLD','$.history[last]')})`:'TRUE';
      const actor=operation==='DELETE'?"'sistema'":`CASE WHEN ${changed} THEN COALESCE(${json(row,'$.history[last].actor')},${json(row,'$.updatedBy')},${json(row,'$.actor')},${json(row,'$.createdBy')},'sistema') ELSE COALESCE(${json(row,'$.updatedBy')},'sistema') END`;
      const actorName=operation==='DELETE'?'NULL':`CASE WHEN ${changed} THEN ${json(row,'$.history[last].actorName')} ELSE NULL END`;
      const action=operation==='DELETE'?"'Registro retirado'":`CASE WHEN ${changed} THEN COALESCE(${json(row,'$.history[last].action')},${operation==='INSERT'?json(row,'$.message')+',':''}'Registro ${operation==='INSERT'?'creado':'actualizado'}') ELSE 'Registro actualizado' END`;
      const name='audit_record_'+operation.toLowerCase();
      const [exists]=await connection.execute('SELECT 1 FROM information_schema.triggers WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME=?',[name]);
      if(!exists.length)await connection.query(`CREATE TRIGGER ${name} AFTER ${operation} ON records FOR EACH ROW ${operation==='UPDATE'?`BEGIN IF NOT (NEW.payload <=> OLD.payload) THEN `:''}INSERT INTO operation_audit(record_id,kind,label,actor,actor_name,occurred_at,action,previous_status,status,changes) VALUES(${row}.id,${row}.kind,COALESCE(${json(row,'$.folio')},${json(row,'$.name')},${row}.id),${actor},${actorName},${time},${action},${operation==='INSERT'?'NULL':json('OLD','$.status')},${operation==='DELETE'?'NULL':json(row,'$.status')},${operation==='DELETE'?'NULL':json(row,'$.history[last].changes')});${operation==='UPDATE'?' END IF; END':''}`);
    }
    for(const operation of ['UPDATE','DELETE']) {
      const name='audit_no_'+operation.toLowerCase();
      const [exists]=await connection.execute('SELECT 1 FROM information_schema.triggers WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME=?',[name]);
      if(!exists.length)await connection.query(`CREATE TRIGGER ${name} BEFORE ${operation} ON operation_audit FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='La bitácora es de sólo lectura'`);
    }
  } finally {
    if(locked)await connection.query("SELECT RELEASE_LOCK(CONCAT(LEFT(DATABASE(),40),':repindsa-audit'))");
    connection.release();
  }
  if(await db.prepare("SELECT id FROM records WHERE id='operation-audit-history-v1'").first())return;
  const rows=(await db.prepare('SELECT id,kind,payload FROM records').all()).results;
  const statements=[];
  for(const row of rows) {
    const record=JSON.parse(row.payload);
    for(const [index,event] of (record.history||[]).entries())if(event.date)statements.push(db.prepare('INSERT OR IGNORE INTO operation_audit(event_key,record_id,kind,label,actor,actor_name,occurred_at,action,previous_status,status,changes,origin) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind('history:'+row.id+':'+index,row.id,row.kind,record.folio||record.name||row.id,event.actor||'sin registro',event.actorName||null,event.date,event.action||'Estado registrado',event.previousStatus||null,event.status||null,event.changes==null?null:typeof event.changes==='string'?event.changes:JSON.stringify(event.changes),'history'));
    if(row.kind==='accessAudit'&&record.date)statements.push(db.prepare("INSERT OR IGNORE INTO operation_audit(event_key,record_id,kind,label,actor,occurred_at,action,origin) VALUES(?,?,?,'Administración de accesos',?,?,?,'history')").bind('access:'+row.id,row.id,row.kind,record.actor||'sin registro',record.date,record.message||'Acceso actualizado'));
  }
  statements.push(db.prepare("INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES('operation-audit-history-v1','config','{\"name\":\"Bitácora inicializada\"}',1,?)").bind(new Date().toISOString()));
  for(let i=0;i<statements.length;i+=100)await db.batch(statements.slice(i,i+100));
}
