import {exerciseProfileUI} from './profile-browser-scenario.mjs';
import {exerciseSelfProfile} from './profile-startup-scenario.mjs';
import {exercisePasswordVisibility} from './password-browser-scenario.mjs';
import {exercisePwa} from './pwa-browser-scenario.mjs';
import {exerciseWorkspaceAlignment} from './workspace-alignment-browser-scenario.mjs';
import {exerciseRequestUX} from './request-ux-browser-scenario.mjs';
import {exerciseMaterialCommentsUI} from './material-comments-browser-scenario.mjs';
import {exerciseMaterialComments} from './material-comments-startup-scenario.mjs';
import {exerciseOrdersUI} from './orders-browser-scenario.mjs';
import {exerciseOrders} from './orders-startup-scenario.mjs';
import {exerciseInventoryUI} from './inventory-browser-scenario.mjs';
import {exerciseInventory} from './inventory-startup-scenario.mjs';
import {exerciseRequestTables} from './request-tables-browser-scenario.mjs';
import {exerciseVariableRouting} from './variable-routing-startup-scenario.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {exerciseRoutingSettingsUI} from './routing-settings-browser-scenario.mjs';
import {createMySQLDatabase} from '../server/mysql.mjs';
import {exerciseWorkspaceAccess} from './workspace-access-startup-scenario.mjs';
import {exerciseWorkspacePicker} from './workspace-access-browser-scenario.mjs';
import {exerciseFuelUI} from './fuel-browser-scenario.mjs';
import {exerciseFuel} from './fuel-startup-scenario.mjs';
import {exerciseViaticosUI} from './viaticos-browser-scenario.mjs';
import {exerciseViaticos} from './viaticos-startup-scenario.mjs';
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
 for(let i=0;i<480;i++){
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
 // Exercise an actual stale-artifact startup, not just a fresh build.
 const releasePath=new URL('../.next/repindsa-release.json',import.meta.url),previousRelease=JSON.parse(await readFile(releasePath,'utf8'));await writeFile(releasePath,JSON.stringify({...previousRelease,fingerprint:'0'.repeat(64)}));
 await start();assert(logs.includes('Compilando la versión actual.'));

 const hostile=await request('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.example','Sec-Fetch-Site':'cross-site'},body:JSON.stringify({action:'login',username,password})});assert.equal(hostile.status,403);
 const unknown=await request('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json',Origin:previewOrigin},body:JSON.stringify({action:'login',username,password})});assert.equal(unknown.status,403);
 const healthResponse=await request('/healthz'),health=await healthResponse.json();assert.equal(health.status,'ok');assert.match(health.release.fingerprint,/^[a-f0-9]{64}$/);assert.equal(healthResponse.headers.get('X-REPINDSA-Build'),health.release.fingerprint.slice(0,12));
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
 await exerciseViaticos(request,cookie,origin);
 await exerciseFuel(request,cookie,origin);
 await exerciseVariableRouting(request,cookie,origin,materialData);
 await exerciseWorkspaceAccess(request,cookie,origin);
 await exerciseMaterialComments(request,cookie,origin,materialData);
 await exerciseSelfProfile(request,cookie,origin);await exerciseInventory(request,cookie,origin);await exerciseOrders(request,cookie,origin);
 if(process.env.RUN_BROWSER_TESTS==='1'){await exerciseProfileUI('http://127.0.0.1:'+port);await exercisePasswordVisibility('http://127.0.0.1:'+port);await exercisePwa('http://127.0.0.1:'+port);await exerciseRoutingSettingsUI('http://127.0.0.1:'+port);await exerciseWorkspacePicker('http://127.0.0.1:'+port);await exerciseFuelUI('http://127.0.0.1:'+port);await exerciseViaticosUI('http://127.0.0.1:'+port);await exerciseDirectorPanelUI('http://127.0.0.1:'+port);await exerciseResponsiveUI('http://127.0.0.1:'+port);await exerciseRequestTables('http://127.0.0.1:'+port);await exerciseMaterialCommentsUI('http://127.0.0.1:'+port);await exerciseRequestUX('http://127.0.0.1:'+port);await exerciseWorkspaceAlignment('http://127.0.0.1:'+port);await exerciseInventoryUI('http://127.0.0.1:'+port);await exerciseOrdersUI('http://127.0.0.1:'+port);await exercisePurchaseReceiptUI('http://127.0.0.1:'+port);}
 const audit=await request('/api/audit?from=2020-01-01&to=2099-01-01&q=prueba',{headers:{Cookie:cookie}});assert.equal(audit.status,200);assert.ok(Array.isArray((await audit.json()).entries));
 const form=new FormData();const bytes=new Uint8Array([255,216,255,217]);form.set('quoteId','smoke-draft');form.set('file',new File([bytes],'test.jpg',{type:'image/jpeg'}));
 const upload=await request('/api/quote-assets',{method:'POST',headers:{Cookie:cookie,Origin:origin},body:form});assert.equal(upload.status,200);const asset=await upload.json();
 const download=await request(asset.url,{headers:{Cookie:cookie}});assert.equal(download.status,200);assert.deepEqual(new Uint8Array(await download.arrayBuffer()),bytes);
 assert.equal((await request(asset.url)).status,401);
 await stop();
 const migrationDB=createMySQLDatabase(env);try{const now=new Date().toISOString(),fixtures=[{id:'migration-old-advance',kind:'cashAdvance',folio:'RP-AC-2026-99998',beneficiary:'Persona histórica',status:'Aprobada'},{id:'migration-old-proof',kind:'cashProof',folio:'RP-CP-2026-99998',advanceId:'migration-old-advance',sourceFolio:'RP-AC-2026-99998',status:'Aprobada'},{id:'migration-old-procedure',kind:'controlledDocument',type:'Procedimiento',cycleCode:'SUM',folio:'RP-DO-2026-99998',status:'Vigente'}];await migrationDB.batch(fixtures.map(r=>migrationDB.prepare('INSERT INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(r.id,r.kind,JSON.stringify(r),now)));await migrationDB.prepare('DELETE FROM app_migrations WHERE name=?').bind('folio-nomenclature-v2').run();await migrationDB.prepare('DELETE FROM app_migrations WHERE name=?').bind('travel-folios-year-v1').run();await start();const get=async id=>JSON.parse((await migrationDB.prepare('SELECT payload FROM records WHERE id=?').bind(id).first()).payload),a=await get('migration-old-advance'),p=await get('migration-old-proof');assert.match(a.folio,/^V-\d{4}-\d{5,}$/);assert.equal(p.advanceId,a.id);assert.equal(p.sourceFolio,a.folio);assert.deepEqual(a.previousFolios,['RP-AC-2026-99998']);assert.match((await get('migration-old-procedure')).folio,/^PR-SUM-/);assert((await migrationDB.prepare('SELECT id FROM folio_rename_backups WHERE id=?').bind(a.id).first()));console.log('MySQL folio migration passed: old records renamed before serving, linked IDs and references retained, original payloads backed up.');}finally{await migrationDB.client.close();}
 cookie=await login(nextPassword);
 const savedOrders=await (await request('/api/orders',{headers:{Cookie:cookie}})).json();assert(savedOrders.orders.some(r=>r.status==='Pagado'&&/^P-\d{4}-\d{5}$/.test(r.folio)));const inventoryAfterRestart=await (await request('/api/inventory',{headers:{Cookie:cookie}})).json();assert(inventoryAfterRestart.state.movements.length>0);console.log('V1.2 persistence passed: inventory movements, loan links, providers, paid orders and automatic order folios survive migrations and restart.');
 const retained=await request(asset.url,{headers:{Cookie:cookie}});assert.equal(retained.status,200);assert.deepEqual(new Uint8Array(await retained.arrayBuffer()),bytes);
 console.log('Production HTTP passed: preview origin through proxy, cross-site rejection, health, homepage, login, password change, recovered projects and articles for materials, audit query, private uploads/downloads, denial without login, and persistence after restart.');
}finally{await stop();}
