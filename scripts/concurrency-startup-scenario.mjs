import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
export async function exerciseConcurrency(request,adminCookie,origin,catalog){
 const send=(path,body,cookie='')=>request(path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)});
 const success=async response=>{const body=await response.json();assert.equal(response.status,200,body.error);return body};
 const users=Array.from({length:12},(_,i)=>({username:'concurrent-'+i,password:randomBytes(24).toString('hex')}));
 for(const u of users)await success(await send('/api/support',{action:'saveUser',data:{...u,name:u.username,role:'Supervisor',level:'Supervisor',rights:{materials:true,requestMaterials:true},active:true}},adminCookie));
 // Two independent browsers for each account; first login requires a password change.
 await Promise.all(users.map(async u=>{const response=await send('/api/material-access',{action:'login',...u});await success(response);const cookie=response.headers.get('set-cookie').split(';')[0];u.password=randomBytes(24).toString('hex');await success(await send('/api/material-access',{action:'password',password:u.password},cookie))}));
 const started=performance.now();
 const sessions=await Promise.all(users.flatMap(u=>[0,1].map(async()=>{const r=await send('/api/material-access',{action:'login',...u});await success(r);return {...u,cookie:r.headers.get('set-cookie').split(';')[0]}})));
 assert.equal(new Set(sessions.map(s=>s.cookie)).size,24);
 await Promise.all(sessions.map(async s=>{const body=await success(await request('/api/material-access',{headers:{Cookie:s.cookie}}));assert.equal(body.user.username,s.username)}));
 const first=sessions.filter((_,i)=>i%2===0),project=catalog.projects[0];
 const drafts=await Promise.all(first.map(async s=>(await success(await send('/api/material-workspace',{action:'saveDraft',record:{projectId:project.id,serviceReference:project.rp,lines:[]}},s.cookie))).record));
 assert.equal(new Set(drafts.map(r=>r.folio)).size,12);
 await Promise.all(first.map(async(s,i)=>{const workspace=await success(await request('/api/material-workspace?catalog=0',{headers:{Cookie:s.cookie}}));const ids=new Set(workspace.records.map(r=>r.id));assert(ids.has(drafts[i].id));assert(drafts.every((r,j)=>j===i||!ids.has(r.id)))}));
 // Racing writes to the same revision must preserve one winner and reject the other.
 const competing=await Promise.all(['A','B'].map(note=>send('/api/material-workspace',{action:'saveDraft',id:drafts[0].id,revision:drafts[0].revision,record:{...drafts[0],neededBy:'2026-12-01',deliveryTo:note}},first[0].cookie)));
 assert.deepEqual(competing.map(r=>r.status).sort(),[200,409]);
 // One logout cannot revoke a second browser or another user's session.
 await success(await send('/api/material-access',{action:'logout'},sessions[0].cookie));
 assert.equal((await success(await request('/api/material-access',{headers:{Cookie:sessions[0].cookie}}))).user,null);
 for(const s of [sessions[1],sessions[2]])assert.equal((await success(await request('/api/material-access',{headers:{Cookie:s.cookie}}))).user.username,s.username);
 console.log('Concurrency HTTP passed: 12 accounts, 24 independent parallel sessions, isolated workspaces, 12 concurrent draft writes with unique folios, and isolated logout ('+Math.round(performance.now()-started)+' ms on test hardware).');
}
