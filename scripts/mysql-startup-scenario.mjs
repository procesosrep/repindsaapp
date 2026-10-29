import {exerciseDirectorPanelUI} from './director-access-browser-scenario.mjs';
import {exerciseDirectorAccess} from './director-access-startup-scenario.mjs';
import {exerciseSimplePurchases} from './simple-purchase-startup-scenario.mjs';
import {exercisePurchaseReceiptUI} from './purchase-receipt-browser-scenario.mjs';
import {exerciseCatalogDocuments} from './catalog-document-startup-scenario.mjs';
import {exerciseConcurrency} from './concurrency-startup-scenario.mjs';
import {exerciseResponsiveUI} from './responsive-browser-scenario.mjs';
import {exerciseMaterials} from './materials-startup-scenario.mjs';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const username='smoke-admin';const password=randomBytes(24).toString('hex');const nextPassword=randomBytes(24).toString('hex');
const origin='https://repindsa.example';
const previewOrigin='https://repindsa.preview.example';
const listener=net.createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
const env={...process.env,DB_HOST:process.env.MYSQL_TEST_HOST,DB_PORT:process.env.MYSQL_TEST_PORT||'3306',DB_USER:process.env.MYSQL_SMOKE_USER,DB_PASSWORD:process.env.MYSQL_SMOKE_PASSWORD,DB_NAME:process.env.MYSQL_SMOKE_DATABASE,APP_ORIGIN:origin,PORT:String(port),ADMIN_USERNAME:username,ADMIN_NAME:'Administrador de prueba',ADMIN_PASSWORD:password};
let server;let logs='';
const request=(path,options={})=>fetch('http://127.0.0.1:'+port+path,{...options,headers:{...options.headers,...(options.headers?.Origin===origin?{Origin:previewOrigin,'Sec-Fetch-Site':'same-origin'}:{})}});
async function start(){
 server=spawn(process.execPath,[fileURLToPath(new URL('../server.js',import.meta.url))],{cwd:tmpdir(),env,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
 for(let i=0;i<120;i++){
  if(server.exitCode!==null)throw Error('Server exited: '+logs);
  try{if((await request('/healthz')).ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw Error('Readiness timeout: '+logs);
}
async function stop(){if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}}
const login=async(pass)=>{
 const r=await request('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({action:'login',username,password:pass})});
 assert.equal(r.status,200);assert.equal((await r.json()).user.role,'Administrador');return r.headers.get('set-cookie').split(';')[0];
};
try{
 await start();
 const hostile=await request('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.example','Sec-Fetch-Site':'cross-site'},body:JSON.stringify({action:'login',username,password})});assert.equal(hostile.status,403);
 const unknown=await request('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json',Origin:previewOrigin},body:JSON.stringify({action:'login',username,password})});assert.equal(unknown.status,403);
 assert.deepEqual(await (await request('/healthz')).json(),{status:'ok'});
 const home=await request('/');assert.equal(home.status,200);assert.match(await home.text(),/<html/);
 assert.deepEqual(await (await request('/api/material-access')).json(),{user:null});
 let cookie=await login(password);
 const changed=await request('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify({action:'password',password:nextPassword})});assert.equal(changed.status,200);
 cookie=await login(nextPassword);
 const records=await request('/api/records',{headers:{Cookie:cookie}});assert.equal(records.status,200);const data=await records.json();const rows=Array.isArray(data)?data:data.records;
 assert.ok(Array.isArray(rows));assert.equal(rows.filter(r=>r.kind==='project').length,27);assert.equal(rows.filter(r=>['employee','quote','opportunity'].includes(r.kind)).length,0);
 const material=await request('/api/material-workspace?catalogOnly=1',{headers:{Cookie:cookie}});assert.equal(material.status,200);const materialData=await material.json();assert.equal(materialData.projects.length,27);assert.equal(materialData.catalog.length,4338);
 const repeated=await request('/api/material-workspace?catalogOnly=1',{headers:{Cookie:cookie}});assert.equal(repeated.status,200);assert.equal((await repeated.json()).projects.length,27);
 await exerciseMaterials(request,cookie,username,origin,materialData);
 await exerciseConcurrency(request,cookie,origin,materialData);
 await exerciseCatalogDocuments(request,cookie,origin);
 await exerciseSimplePurchases(request,cookie,origin,materialData);
 await exerciseDirectorAccess(request,cookie,origin);
 if(process.env.RUN_BROWSER_TESTS==='1'){await exerciseDirectorPanelUI('http://127.0.0.1:'+port);await exerciseResponsiveUI('http://127.0.0.1:'+port);await exercisePurchaseReceiptUI('http://127.0.0.1:'+port);}
 const audit=await request('/api/audit?from=2020-01-01&to=2099-01-01&q=prueba',{headers:{Cookie:cookie}});assert.equal(audit.status,200);assert.ok(Array.isArray((await audit.json()).entries));
 const form=new FormData();const bytes=new Uint8Array([255,216,255,217]);form.set('quoteId','smoke-draft');form.set('file',new File([bytes],'test.jpg',{type:'image/jpeg'}));
 const upload=await request('/api/quote-assets',{method:'POST',headers:{Cookie:cookie,Origin:origin},body:form});assert.equal(upload.status,200);const asset=await upload.json();
 const download=await request(asset.url,{headers:{Cookie:cookie}});assert.equal(download.status,200);assert.deepEqual(new Uint8Array(await download.arrayBuffer()),bytes);
 assert.equal((await request(asset.url)).status,401);
 await stop();await start();cookie=await login(nextPassword);
 const retained=await request(asset.url,{headers:{Cookie:cookie}});assert.equal(retained.status,200);assert.deepEqual(new Uint8Array(await retained.arrayBuffer()),bytes);
 console.log('Production HTTP passed: preview origin through proxy, cross-site rejection, health, homepage, login, password change, recovered projects and articles for materials, audit query, private uploads/downloads, denial without login, and persistence after restart.');
}finally{await stop();}
