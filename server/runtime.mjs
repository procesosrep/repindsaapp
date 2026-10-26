import {createMySQLDatabase,MySQLBucket} from './mysql.mjs';
import {createClient} from '@libsql/client';
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';

export class Database {
 constructor(client){this.client=client;}
 prepare(sql){return new Statement(this,sql);}
 async batch(statements){const results=await this.client.batch(statements.map(s=>({sql:s.sql,args:s.args})),'write');return results.map(result);}
}
const result=r=>({success:true,results:Array.from(r.rows||[]),meta:{changes:r.rowsAffected||0,last_row_id:Number(r.lastInsertRowid||0)}});
class Statement {
 constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args;}
 bind(...args){return new Statement(this.db,this.sql,args.map(v=>v===undefined?null:v));}
 async all(){return result(await this.db.client.execute({sql:this.sql,args:this.args}));}
 async run(){return this.all();}
 async first(column){const r=(await this.all()).results[0];return r?(column?r[column]:r):null;}
}
export function createDatabase(){if(process.env.DB_HOST)return createMySQLDatabase();const url=process.env.DATABASE_URL||'file:./data/repindsa.db';if(process.env.NODE_ENV==='production'&&url.startsWith('file:')&&process.env.ALLOW_LOCAL_STORAGE!=='1')throw Error('Configura DATABASE_URL remota o un volumen persistente con ALLOW_LOCAL_STORAGE=1.');return new Database(createClient({url,authToken:process.env.DATABASE_AUTH_TOKEN}));}
export class LocalBucket {
 constructor(root){this.root=resolve(root);}
 path(key){const p=resolve(this.root,key);if(!p.startsWith(this.root+sep))throw Error('Clave de archivo inválida.');return p;}
 async put(key,body){const path=this.path(key);await mkdir(dirname(path),{recursive:true});const bytes=body instanceof ArrayBuffer?new Uint8Array(body):body;await writeFile(path,bytes);}
 async get(key){try{return {body:new Uint8Array(await readFile(this.path(key)))}}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 async delete(key){try{await unlink(this.path(key))}catch(e){if(e.code!=='ENOENT')throw e;}}
}
export class S3Bucket {
 constructor(){this.bucket=process.env.S3_BUCKET;this.client=new S3Client({region:process.env.S3_REGION||'auto',endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true',credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});}
 async put(key,body,options={}){const bytes=body instanceof ArrayBuffer?new Uint8Array(body):body;await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:key,Body:bytes,ContentType:options.httpMetadata?.contentType}));}
 async get(key){try{const o=await this.client.send(new GetObjectCommand({Bucket:this.bucket,Key:key}));return {body:await o.Body.transformToWebStream()}}catch(e){if(e.name==='NoSuchKey'||e.$metadata?.httpStatusCode===404)return null;throw e;}}
 async delete(key){await this.client.send(new DeleteObjectCommand({Bucket:this.bucket,Key:key}));}
}
let db,bucket;
export const env=new Proxy({}, {get(_,key){if(key==='DB')return db??=createDatabase();if(key==='BUCKET'){if(!bucket){if((db??=createDatabase()).dialect==='mysql')bucket=new MySQLBucket(db);else if(process.env.S3_BUCKET)bucket=new S3Bucket();else {if(process.env.NODE_ENV==='production'&&process.env.ALLOW_LOCAL_STORAGE!=='1')throw Error('Configura almacenamiento S3 persistente.');bucket=new LocalBucket(process.env.UPLOAD_DIR||'./data/uploads');}}return bucket;}return process.env[key];}});
