import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

test('GoDaddy MySQL arranca su adaptador sin resolver libSQL ni S3',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'repindsa-no-legacy-'));
 try {
  const loader=join(directory,'loader.mjs');const preload=join(directory,'preload.mjs');
  await writeFile(loader,"export async function resolve(specifier,context,next){if(specifier==='@libsql/client'||specifier==='@aws-sdk/client-s3')throw Error('Unexpected legacy dependency');return next(specifier,context);}");
  await writeFile(preload,"import Module from 'node:module';const load=Module._load;Module._load=function(specifier,...args){if(specifier==='@libsql/client'||specifier==='@aws-sdk/client-s3')throw Error('Unexpected legacy dependency');return load.call(this,specifier,...args);};");
  const runtime=new URL('../server/runtime.mjs',import.meta.url).href;
  const script=`const {env}=await import(${JSON.stringify(runtime)});if(env.DB.dialect!=='mysql'||env.BUCKET.constructor.name!=='MySQLBucket')throw Error('Wrong adapters');await env.DB.client.close();`;
  const result=spawnSync(process.execPath,['--experimental-loader',pathToFileURL(loader).href,'--import',pathToFileURL(preload).href,'--input-type=module','-e',script],{
   env:{...process.env,DB_HOST:'127.0.0.1',DB_PORT:'3306',DB_USER:'test',DB_NAME:'test',NODE_ENV:'production'},encoding:'utf8',timeout:15000,
  });
  assert.equal(result.status,0,result.stderr);
 } finally {await rm(directory,{recursive:true,force:true});}
});
