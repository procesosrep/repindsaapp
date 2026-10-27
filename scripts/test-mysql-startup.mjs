import {fileURLToPath} from 'node:url';
import {access} from 'node:fs/promises';
import mysql from 'mysql2/promise';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
if(!process.env.MYSQL_TEST_HOST)throw Error('Configura MYSQL_TEST_HOST para un servidor exclusivo de pruebas.');
await access(new URL('../.next/BUILD_ID',import.meta.url));
const admin=await mysql.createConnection({host:process.env.MYSQL_TEST_HOST,port:Number(process.env.MYSQL_TEST_PORT||3306),user:process.env.MYSQL_TEST_USER||'root',password:process.env.MYSQL_TEST_PASSWORD||''});
const suffix=randomBytes(8).toString('hex');const user='limited_'+suffix;const name='repindsa_smoke_'+suffix;const password=randomBytes(24).toString('hex');
try{
 await admin.query('CREATE DATABASE `'+name+'`');
 await admin.query('CREATE USER ?@\'%\' IDENTIFIED BY ?',[user,password]);
 await admin.query('GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX ON `'+name+'`.* TO ?@\'%\'',[user]);
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./mysql-startup-scenario.mjs',import.meta.url))],{env:{...process.env,MYSQL_SMOKE_USER:user,MYSQL_SMOKE_PASSWORD:password,MYSQL_SMOKE_DATABASE:name},encoding:'utf8',timeout:180000});
 if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);
 if(result.status!==0)process.exitCode=1;
 else console.log('Managed MySQL production HTTP checks passed without SUPER/TRIGGER grants.');
}finally{
 await admin.query('DROP DATABASE IF EXISTS `'+name+'`');await admin.query('DROP USER IF EXISTS ?@\'%\'',[user]);await admin.end();
}
