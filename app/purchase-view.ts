type R=Record<string,any>;
export function purchaseTrackingOptions(r:R):string[]{
 const state=r.procurementStatus||'Emitida';if(r.status==='Borrador'||r.status==='Recibida')return [];
 if(r.standalone&&state==='Enviado a sitio')return ['Entregado a almacén'];
 if(state==='Emitida')return ['Cotizado'];if(state==='Cotizado')return ['Comprado'];
 if(state==='Comprado')return [...(!(r.lines||[]).some((l:R)=>Number(l.siteDispatchedQuantity||0)>0)?['Entregado a almacén']:[]),...(!r.standalone?['Enviado a sitio']:[]),'Comprado'];
 return [];
}
export function nextPurchaseStage(r:R){return purchaseTrackingOptions(r)[0]||'';}
