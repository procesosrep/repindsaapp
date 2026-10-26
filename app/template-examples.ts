import examples from './data/template-examples.json';
type R=Record<string,any>;
export async function ensureTemplateExamples(req:Request,db:any,post:(req:Request)=>Promise<Response>){
 const lookup=async(id:string)=>{const r=await db.prepare('SELECT payload,revision FROM records WHERE id=?').bind(id).first();return r?{...JSON.parse(r.payload),revision:r.revision}:null;};
 const send=async(r:R)=>{const response=await post(new Request(req.url,{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':req.headers.get('oai-authenticated-user-id')||'','oai-authenticated-user-email':req.headers.get('oai-authenticated-user-email')||''},body:JSON.stringify(r)}));const body:any=await response.json();if(!response.ok){if(response.status===409){const existing=await lookup(r.id);if(existing)return existing;}throw Error(body.error||'No se pudo preparar el ejemplo.');}return lookup(r.id);};
 for(const example of examples){
  const marker=example.quote.id+'-prepared';if(await lookup(marker))continue;
  let client=await lookup(example.client.id);if(!client){const all=await db.prepare("SELECT payload,revision FROM records WHERE kind='client'").all();client=all.results.map((r:any)=>({...JSON.parse(r.payload),revision:r.revision})).find((r:R)=>r.name.trim().toLocaleLowerCase('es-MX')===example.client.name.trim().toLocaleLowerCase('es-MX'))||await send(example.client);}
  const opportunity=await lookup(example.opportunity.id)||await send({...example.opportunity,clientId:client.id});
  const date=new Date().toISOString().slice(0,10),validUntil=new Date(Date.now()+90*86400000).toISOString().slice(0,10),plannedStart=new Date(Date.now()+(example.quote.division==='Piping'?5:20)*86400000).toISOString().slice(0,10);
  let quote=await lookup(example.quote.id)||await send({...example.quote,clientId:client.id,opportunityId:opportunity.id,date,validUntil,plannedStart,staffing:example.quote.budgetResources.filter((r:R)=>r.costingMode==='personnel').map((r:R)=>({position:r.name,quantity:r.headcount,neededBy:plannedStart,dailyRate:r.dailyAllowance,requirements:'Validar expediente, aptitud médica e inducción antes de movilización.',fromBudget:true}))});
  if(quote.status==='Borrador'){if(!quote.kickoff?.confirmedAt)quote=await send({...quote,_confirmKickoff:true,kickoff:{participants:'Comercial · Operaciones · RH',scopeReviewed:true,costsReviewed:true,termsReviewed:true,notes:'Ejemplo autorizado: revisión de sistemas, subsistemas, presupuesto general, personal, condiciones y anexos. Costos internos simulados. No enviado al cliente.'}});quote=await send({...quote,status:'Emitida'});}
  await db.prepare('INSERT OR IGNORE INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(marker,'config',JSON.stringify({id:marker,kind:'config',name:'Ejemplo de plantilla preparado',quoteId:quote.id}),new Date().toISOString()).run();
 }
}
