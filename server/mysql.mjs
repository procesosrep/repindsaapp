import {recordMutation,recordIdentity,captureRecordChange} from './mysql-record-audit.mjs';
import mysql from 'mysql2/promise';

// Compatibility for the application's small, parameterized SQLite query surface.
// Each batch uses one connection and an actual InnoDB transaction.
export function mysqlSQL(source) {
  let sql=source.replace(/INSERT OR IGNORE INTO/gi,'INSERT INTO');
  sql=sql.replace(/ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET/gi,'ON DUPLICATE KEY UPDATE')
    .replace(/\bexcluded\.([a-z_]+)/gi,(_,name)=>`VALUES(\`${name}\`)`);
  sql=sql.replace(/json_extract\(([^,()]+),\s*'([^']+)'\)/gi,(_,field,path)=>`JSON_UNQUOTE(JSON_EXTRACT(${field},'${path.replaceAll('[#-1]','[last]')}'))`);
  sql=sql.replace("'local-member-'||replace(a.actor,'usuario:','')", "CONCAT('local-member-',replace(a.actor,'usuario:',''))");
  if (/^\s*CREATE TABLE/i.test(sql)) {
    sql=sql.replace(/(`?[a-z_]+`?)\s+TEXT\b/gi,(_,name)=>`${name} ${['payload','rights','details','changes','label','action'].includes(name.replaceAll('`','').toLowerCase())?'LONGTEXT':'VARCHAR(191)'}`)
      .replace(/\bINTEGER\b/gi,'BIGINT').replace(/\bAUTOINCREMENT\b/gi,'AUTO_INCREMENT');
    sql+=' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin';
  }
  // Quote reserved column identifiers without changing literals or quoted names.
  sql=sql.replace(/'(?:''|[^'])*'|`[^`]*`|\b[a-z_]+\b/gi,token=>/^(key|value|groups|rank|system)$/i.test(token)?'`'+token+'`':token);
  sql=sql.replace(/(PRIMARY|FOREIGN|DUPLICATE) `key`/gi,'$1 KEY');
  return sql;
}

export class MySQLDatabase {
  dialect='mysql';
  constructor(pool) {this.pool=pool;this.client={close:()=>pool.end()};}
  prepare(sql) {return new Statement(this,sql);}
  async batch(statements) {
    // MySQL DDL implicitly commits. Run schema setup explicitly outside DML batches.
    const schema=statements.some(s=>/^\s*(CREATE|ALTER|DROP)\b/i.test(s.sql));
    if(schema && statements.some(s=>!/^\s*(CREATE|ALTER|DROP)\b/i.test(s.sql)))throw Error('No mezcles DDL y cambios de datos en un lote MySQL.');
    for(let attempt=0;;attempt++) {
      try {return await this.runBatch(statements,schema);}
      catch(error) {
        // Only retry a deadlock victim: MySQL guarantees that transaction lost.
        // Network/commit errors have an uncertain outcome and must not be retried.
        if(schema||error.code!=='ER_LOCK_DEADLOCK'||attempt>=2)throw error;
        await new Promise(resolve=>setTimeout(resolve,10*(attempt+1)));
      }
    }
  }
  async runBatch(statements,schema) {
    const connection=await this.pool.getConnection();
    try {
      if(!schema)await connection.beginTransaction();
      const results=[];
      for(const statement of statements)results.push(await this.execute(connection,statement.sql,statement.args));
      if(!schema)await connection.commit();
      return results;
    } catch(error) {if(!schema)await connection.rollback();throw error;}
    finally {connection.release();}
  }
  async execute(connection, source, args=[], internal=false) {
    if(!internal&&/^\s*(?:UPDATE|DELETE\s+FROM|REPLACE\s+INTO|TRUNCATE(?:\s+TABLE)?|DROP\s+TABLE|ALTER\s+TABLE)\s+`?operation_audit`?\b/i.test(source)) {
      throw Object.assign(new Error('La bitácora es de sólo lectura'),{code:'AUDIT_READ_ONLY'});
    }
    const operation=recordMutation(source);
    if(!internal&&operation&&this.applicationAudit?.has(operation)) {
      const id=recordIdentity(source,args);
      let before=null;
      if(operation!=='INSERT'||/ON CONFLICT|ON DUPLICATE KEY/i.test(source)) {
        const [rows]=await connection.execute('SELECT id,kind,payload FROM records WHERE id=? FOR UPDATE',[id]);before=rows[0]||null;
      }
      const result=await this.execute(connection,source,args,true);
      if(result.meta.changes) {
        const [rows]=await connection.execute('SELECT id,kind,payload FROM records WHERE id=?',[id]);
        const after=rows[0]||null;
        await captureRecordChange(connection,before&&after?'UPDATE':after?'INSERT':'DELETE',before,after);
      }
      return result;
    }
    if (/sqlite_schema/.test(source)) {
      const name=source.match(/name\s*=\s*'([^']+)'/i)?.[1];
      const [rows]=await connection.execute('SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE()'+(name?' AND TABLE_NAME=?':''),name?[name]:[]);
      return output(rows);
    }
    if (/FROM json_each\(\?\)/i.test(source)) {
      // Import bounded groups in one round trip; preserve already edited rows.
      const input=JSON.parse(args[0]);let changes=0;
      for(let offset=0;offset<input.length;offset+=100) {
        const rows=input.slice(offset,offset+100);
        const [result]=await connection.execute('INSERT INTO material_catalog_v2(id,payload) VALUES '+rows.map(()=>'(?,?)').join(',')+' ON DUPLICATE KEY UPDATE id=id',rows.flatMap(row=>[row.id,JSON.stringify(row)]));
        changes+=Number(result.affectedRows||0);
      }
      return output([],changes);
    }
    const returning=source.match(/\s+RETURNING\s+(\w+)\s*$/i);
    let sql=mysqlSQL(returning?source.slice(0,returning.index):source);
    const index=sql.match(/^CREATE INDEX IF NOT EXISTS\s+`?(\w+)`?\s+ON\s+`?(\w+)`?/i);
    if(index) {
      const [rows]=await connection.execute('SELECT 1 FROM information_schema.statistics WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?',[index[2],index[1]]);
      if(rows.length)return output([]);
      sql=sql.replace(/CREATE INDEX IF NOT EXISTS/i,'CREATE INDEX');
    }
    let rows;
    try {[rows]=await connection.execute(sql,args);}
    catch(error) {
      if ((/INSERT OR IGNORE/i.test(source)&&error.code==='ER_DUP_ENTRY') || (index&&error.code==='ER_DUP_KEYNAME'))return output([]);
      throw error;
    }
    if(returning) {
      const table=source.match(/INSERT INTO\s+(\w+)/i)?.[1];
      if(!['sequences','material_login_limits'].includes(table))throw Error('RETURNING no soportado para esta tabla.');
      const [selected]=await connection.execute(`SELECT \`${returning[1]}\` FROM \`${table}\` WHERE \`key\`=? FOR UPDATE`,[args[0]]);
      return output(selected,rows.affectedRows,rows.insertId);
    }
    return Array.isArray(rows)?output(rows):output([],rows.affectedRows,rows.insertId);
  }
}
function output(rows,changes=0,last=0){return {success:true,results:rows,meta:{changes:Number(changes||0),last_row_id:Number(last||0)}};}
class Statement {
  constructor(db,sql,args=[]) {this.db=db;this.sql=sql;this.args=args;}
  bind(...args) {return new Statement(this.db,this.sql,args.map(v=>v===undefined?null:v));}
  async all() {return (await this.db.batch([this]))[0];}
  async run() {return this.all();}
  async first(column) {const row=(await this.all()).results[0];return row?(column?row[column]:row):null;}
}
export function createMySQLDatabase(config=process.env) {
  const user=config.DB_USER||config.DB_USERNAME;
  const database=config.DB_NAME||config.DB_DATABASE;
  if(!config.DB_HOST||!user||!database)throw Error('Configura DB_HOST, DB_USER (o DB_USERNAME), DB_NAME y DB_PASSWORD en Secretos de GoDaddy.');
  const port=Number(config.DB_PORT||3306);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('Configura DB_PORT con el puerto MySQL válido.');
  const pool=mysql.createPool({host:config.DB_HOST,port,user,password:config.DB_PASSWORD||'',database,
    connectionLimit:5,charset:'utf8mb4_bin',supportBigNumbers:true,connectTimeout:15000,
    ...(config.DB_SSL==='true'?{ssl:{rejectUnauthorized:true,...(config.DB_SSL_CA?{ca:config.DB_SSL_CA}:{})}}:{}),
  });
  return new MySQLDatabase(pool);
}

// Private attachments live in the same hosted database, not ephemeral app files.
export class MySQLBucket {
  constructor(db){this.db=db;}
  async put(key,body) {
    const bytes=body instanceof ArrayBuffer?Buffer.from(body):Buffer.from(body);
    // Small chunks stay below the host's max_allowed_packet; one atomic transaction.
    const chunks=[];for(let offset=0;offset<bytes.length;offset+=256*1024)chunks.push(bytes.subarray(offset,offset+256*1024));
    if(!chunks.length)chunks.push(Buffer.alloc(0));
    await this.db.batch([
      this.db.prepare('INSERT INTO app_files(file_key,byte_length) VALUES(?,?) ON CONFLICT(file_key) DO UPDATE SET byte_length=excluded.byte_length').bind(key,bytes.length),
      this.db.prepare('DELETE FROM app_file_chunks WHERE file_key=?').bind(key),
      ...chunks.map((chunk,index)=>this.db.prepare('INSERT INTO app_file_chunks(file_key,chunk_no,content) VALUES(?,?,?)').bind(key,index,chunk)),
    ]);
  }
  async get(key) {
    const results=await this.db.batch([
      this.db.prepare('SELECT byte_length FROM app_files WHERE file_key=?').bind(key),
      this.db.prepare('SELECT chunk_no,content FROM app_file_chunks WHERE file_key=? ORDER BY chunk_no').bind(key),
    ]);
    if(!results[0].results.length)return null;
    const chunks=results[1].results;
    const body=Buffer.concat(chunks.map(row=>row.content));
    if(!chunks.length||chunks.some((row,index)=>Number(row.chunk_no)!==index)||body.length!==Number(results[0].results[0].byte_length)) {
      throw Object.assign(new Error('El archivo está incompleto. No se entregará una descarga parcial.'),{code:'ATTACHMENT_INCOMPLETE'});
    }
    return {body:new Uint8Array(body)};
  }
  async delete(key) {await this.db.batch([this.db.prepare('DELETE FROM app_files WHERE file_key=?').bind(key),this.db.prepare('DELETE FROM app_file_chunks WHERE file_key=?').bind(key)]);}
}
