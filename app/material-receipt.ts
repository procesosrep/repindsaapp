type R=Record<string,any>;
function receiptId(){if(typeof crypto.randomUUID==='function')return crypto.randomUUID();return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
export function receiptToday(now=new Date()){return now.toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'});}
export function receiptDeadline(date:string){const d=new Date(date+'T12:00:00Z');let left=2;while(left){d.setUTCDate(d.getUTCDate()+1);if(d.getUTCDay()!==0&&d.getUTCDay()!==6)left--;}return d.toISOString().slice(0,10);}
export function receiptResponsible(r:R){return r.receiptOwnerId||r.ownerId||r.requesterId||r.createdById||r.createdBy;}
export function receiptIsOwner(r:R,c:R){const id=receiptResponsible(r);return id===c.userId||id===c.email;}
export function pendingReceipts(r:R){return (r.deliveries||[]).filter((d:R)=>d.status==='Pendiente');}
export function receiptOverdue(r:R,today=receiptToday()){return pendingReceipts(r).filter((d:R)=>today>d.dueDate);}
export function receiptTasks(rows:R[],c:R,today=receiptToday()){return rows.filter(r=>r.kind==='materialRequest'&&receiptIsOwner(r,c)&&receiptOverdue(r,today).length);}
export function receiptState(r:R){if(!r.receiptVersion)return r.status;if((r.deliveries||[]).some((d:R)=>d.status==='Diferencia'))return 'Diferencia reportada';if(pendingReceipts(r).length)return 'Pendiente de confirmar recepción';const active=(r.lines||[]).filter((l:R)=>Number(l.quantity)>0&&l.status!=='Rechazada');const confirmed=active.length&&active.every((l:R,i:number)=>{const index=r.lines.indexOf(l);return receiptConfirmed(r,index)>=Number(l.quantity)-.000001;});if(confirmed)return 'Completada y confirmada';if((r.deliveries||[]).some((d:R)=>['Confirmada','Resuelta'].includes(d.status)))return 'Recepción parcial confirmada';return r.fulfillmentStatus||r.status;}
export function receiptConfirmed(r:R,index:number){return Number(r.receiptBaseline?.[index]||0)+(r.deliveries||[]).reduce((n:number,d:R)=>n+(['Confirmada','Diferencia','Resuelta'].includes(d.status)?Number(d.response?.find((x:R)=>x.index===index)?.received||0):0),0);}
// Run on the server after validated fulfillment. Never accept receipt fields from a warehouse form.
export function recordMaterialDelivery(next:R,old:R|undefined,actor:string,now=new Date()){
 const delta=(next.lines||[]).map((l:R,index:number)=>({index,lineId:l.id||String(index),description:l.description,unit:l.unit,quantity:Number(l.delivered||0)-Number(old?.lines?.[index]?.delivered||0)})).filter((l:R)=>l.quantity>.000001);
 if(!delta.length){if(next.receiptVersion)next.status=receiptState(next);return next;}
 const base=old?.receiptVersion?old.receiptBaseline:[];if(!old?.receiptVersion)for(const l of delta)l.quantity=Number(next.lines[l.index].delivered||0);
 // Include previously delivered open quantities when confirmation is first activated.
 if(!old?.receiptVersion)for(let index=0;index<(next.lines||[]).length;index++){if(Number(next.lines[index].delivered||0)>0&&!delta.some((x:R)=>x.index===index)){const l=next.lines[index];delta.push({index,lineId:l.id||String(index),description:l.description,unit:l.unit,quantity:Number(l.delivered)});}}
 const delivery={id:receiptId(),date:now.toISOString(),dueDate:receiptDeadline(receiptToday(now)),actor,status:'Pendiente',lines:delta};
 return {...next,receiptVersion:1,receiptBaseline:base||[],fulfillmentStatus:next.status,deliveries:[...(old?.deliveries||[]),delivery],status:'Pendiente de confirmar recepción'};
}
export function respondReceipt(old:R,id:string,values:R[]|undefined,reason:string,actor:string,now=new Date()){
 const delivery=(old.deliveries||[]).find((d:R)=>d.id===id);if(!delivery||delivery.status!=='Pendiente')throw Error('Esta entrega ya fue atendida o no existe. Actualiza la solicitud.');
 if(values!==undefined&&(!Array.isArray(values)||values.length!==delivery.lines.length))throw Error('Revisa todas las partidas de la entrega.');
 const response=delivery.lines.map((l:R,i:number)=>{const raw=values?.[i]?.received??(values===undefined?l.quantity:undefined),received=Number(raw);if(raw===''||raw==null||!Number.isFinite(received)||received<0||received>l.quantity+.000001)throw Error('Indica cuánto recibiste de cada partida, entre 0 y la cantidad de esta entrega.');return {index:l.index,lineId:l.lineId,received};});
 const difference=response.some((x:R,i:number)=>x.received<delivery.lines[i].quantity-.000001);if(difference&&(!reason.trim()||reason.length>1200))throw Error('Explica la diferencia para que Almacén pueda resolverla.');
 const next:R={...old,deliveries:old.deliveries.map((d:R)=>d.id===id?{...d,status:difference?'Diferencia':'Confirmada',response,reason:difference?reason.trim():'',respondedBy:actor,respondedAt:now.toISOString()}:d)};next.status=receiptState(next);if(next.status==='Completada y confirmada')next.closedAt=now.toISOString();return next;
}
export function resolveReceipt(old:R,id:string,reason:string,actor:string,now=new Date()){
 const d=(old.deliveries||[]).find((v:R)=>v.id===id);if(!d||d.status!=='Diferencia')throw Error('La diferencia ya fue resuelta o no existe.');if(!reason.trim()||reason.length>1200)throw Error('Documenta la resolución de Almacén.');
 const lines=old.lines.map((l:R,index:number)=>{const expected=d.lines.find((x:R)=>x.index===index),actual=d.response.find((x:R)=>x.index===index);return expected?{...l,delivered:Number(l.delivered||0)-(expected.quantity-actual.received)}:{...l};});
 const next:R={...old,lines,fulfillmentStatus:'Entrega parcial',deliveries:old.deliveries.map((v:R)=>v.id===id?{...v,status:'Resuelta',resolution:reason.trim(),resolvedBy:actor,resolvedAt:now.toISOString()}:v)};next.status=receiptState(next);return next;
}
export function receiptSubmissionError(rows:R[],c:R,draft?:R,today=receiptToday()){return receiptTasks(rows,c,today).length&&draft?.receiptException?.status!=='Autorizada'?'Tienes recepciones vencidas. Confirma o reporta diferencias antes de enviar otra solicitud. Puedes guardar borradores o solicitar una excepción urgente al gerente.':'';}
export function receiptDemoRecord(){const old:R={id:'demo-material-receipt',kind:'materialRequest',folio:'DEMO-RECEPCIÓN-001',projectName:'Proyecto de demostración',requester:'Solicitante de prueba',requesterId:'local:demo-supervisor',createdBy:'usuario:demo-supervisor',assignedApprover:'demo-gerente',approvalFlow:2,managerApprovedAt:'2026-10-19T14:00:00Z',status:'En almacén',lines:[{id:'demo-tubo',description:'Tubo de prueba',quantity:10,requestedQuantity:10,unit:'Pieza',available:10,delivered:0}]};return {...recordMaterialDelivery({...old,lines:[{...old.lines[0],delivered:6}],status:'Entrega parcial'},old,'usuario:demo-almacen',new Date('2026-10-19T16:00:00Z')),revision:1,canConfirmReceipt:true,canResolveReceipt:true,receiptResponsibleName:'Solicitante de prueba'};}

// Keep confirmation separate from physical dispatch; pending includes unconfirmed deliveries.
export function receiptProgress(r:R){
 return (r.lines||[]).map((l:R,index:number)=>{
  const authorized=Math.max(0,Number(l.quantity||0)),requested=Number(l.requestedQuantity??authorized);
  const received=Math.min(authorized,Math.max(0,receiptConfirmed(r,index)));
  const unconfirmed=Math.min(authorized-received,(r.deliveries||[]).filter((d:R)=>d.status==='Pendiente').reduce((n:number,d:R)=>n+(d.lines||[]).filter((x:R)=>x.index===index).reduce((sum:number,x:R)=>sum+Number(x.quantity||0),0),0));
  return {id:l.id||String(index),description:l.description,unit:l.unit,requested,authorized,received:Number(received.toFixed(6)),pending:Number(Math.max(0,authorized-received).toFixed(6)),unconfirmed:Number(unconfirmed.toFixed(6))};
 }).filter((l:R)=>l.requested>0);
}
