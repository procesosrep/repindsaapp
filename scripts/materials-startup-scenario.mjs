import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';

export async function exerciseMaterials(request,adminCookie,adminUsername,origin,catalog) {
 const send=(path,body,cookie)=>request(path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)});
 const success=async response=>{const body=await response.json();assert.equal(response.status,200,body.error);return body;};
 const accounts=[
  ['phase-requester','Supervisor',{materials:true,requestMaterials:true}],
  ['phase-approver','Gerente',{materials:true,approveMaterials:true}],
  ['phase-alternate','Gerente',{materials:true,approveMaterials:true}],
  ['phase-warehouse','Almacén',{materials:true,warehouse:true,requestPurchase:true}],
 ];
 assert.equal((await send('/api/support',{action:'saveLevel',data:{name:'Invalid materials template',baseRole:'Supervisor',rights:{requestMaterials:true,materials:false}}},adminCookie)).status,400);
 await success(await send('/api/support',{action:'saveLevel',data:{name:'Admin template test',baseRole:'Administrador',rights:{}}},adminCookie));
 const settings=await success(await send('/api/support',{action:'users'},adminCookie));
 assert.equal(settings.levels.find(level=>level.name==='Admin template test').rights.configuration,true);
 const cookies={};
 for(const [username,role,rights] of accounts){
  const temporary=randomBytes(24).toString('hex'),password=randomBytes(24).toString('hex');
  await success(await send('/api/support',{action:'saveUser',data:{username,name:username,role,level:role,rights,active:true,password:temporary}},adminCookie));
  let response=await send('/api/material-access',{action:'login',username,password:temporary},'');await success(response);let cookie=response.headers.get('set-cookie').split(';')[0];
  await success(await send('/api/material-access',{action:'password',password},cookie));
  response=await send('/api/material-access',{action:'login',username,password},'');await success(response);cookies[username]=response.headers.get('set-cookie').split(';')[0];
 }
 // Phase one needs Materials routes, not users/routes for Caja or Treasury.
 await success(await send('/api/support',{action:'saveRouting',data:{materialApprover:'phase-approver',fallbackApprover:'phase-alternate',warehouseOperator:'phase-warehouse'}},adminCookie));
 const requester=cookies['phase-requester'],approver=cookies['phase-approver'],warehouse=cookies['phase-warehouse'];
 const project=catalog.projects[0],item=catalog.catalog[0];
 const data={projectId:project.id,serviceReference:project.rp,lines:[{id:randomUUID(),catalogId:item.id,description:item.description,quantity:2,unit:item.unit||'Pieza'}]};
 const ownAdmin=(await success(await send('/api/material-workspace',{action:'submit',record:data},adminCookie))).record;
 assert.equal((await send('/api/cash',{action:'materialManager',record:ownAdmin},adminCookie)).status,403);
 assert.equal((await send('/api/material-workspace',{action:'submit',record:{...data,lines:[]}},requester)).status,400);
 assert.equal((await send('/api/material-workspace',{action:'submit',record:{...data,lines:[{...data.lines[0],quantity:''}]}},requester)).status,400);
 let record=(await success(await send('/api/material-workspace',{action:'saveDraft',record:data},requester))).record;assert.equal(record.status,'Borrador');
 const draft={...record};
 record=(await success(await send('/api/material-workspace',{action:'submit',id:record.id,revision:record.revision,record},requester))).record;
 assert.equal(record.assignedApprover,'phase-approver');assert.equal(record.status,'Pendiente de autorización');
 assert.equal((await send('/api/material-workspace',{action:'submit',id:draft.id,revision:draft.revision,record:draft},requester)).status,409);
 assert.equal((await send('/api/cash',{action:'materialManager',record},requester)).status,403);
 record=(await success(await send('/api/cash',{action:'materialManager',record},approver))).record;assert.equal(record.lines[0].quantity,2);
 record=(await success(await send('/api/cash',{action:'materialUpdate',record:{...record,lines:record.lines.map(line=>({...line,available:2,purchase:0,delivered:0}))}},warehouse))).record;
 record=(await success(await send('/api/cash',{action:'materialSupply',supplyAll:true,record},warehouse))).record;
 const delivery=record.deliveries.find(d=>d.status==='Pendiente');assert.ok(delivery);
 const receipt={action:'confirm',id:record.id,revision:record.revision,deliveryId:delivery.id};
 assert.equal((await send('/api/material-receipts',receipt,warehouse)).status,403);
 record=(await success(await send('/api/material-receipts',receipt,requester))).record;
 assert.equal(record.status,'Completada y confirmada');assert.equal(record.lines[0].delivered,2);
 console.log('Materials HTTP passed: limited-role users, materials-only routing, invalid submissions, draft/submit, stale-write denial, assigned approval, warehouse delivery and requester receipt.');
}
