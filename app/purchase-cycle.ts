import {recordMaterialDelivery,receiptResponsible,receiptDeadline,receiptToday} from './material-receipt';
import {materialStatus} from './material-model';
type R=Record<string,any>;
export function purchaseReceiptReady(p:R){return p.procurementStatus==='Entregado a almacén'&&!['Borrador','Recibida'].includes(p.status);}
export function receivePurchase(p:R,values:R[],actor:string){
 if(!purchaseReceiptReady(p))throw Error('Compras debe marcar Entregado a almacén antes de confirmar la recepción física.');
 if(!Array.isArray(values)||values.length!==p.lines.length)throw Error('Conserva las partidas originales.');let changed=false;
 const lines=p.lines.map((l:R,i:number)=>{if(values[i].id!==l.id)throw Error('Conserva el orden y los identificadores de las partidas.');const n=Number(values[i].received),previous=Number(l.received||0),max=Math.min(Number(l.purchasedQuantity||0),Number(l.quantity)-Number(l.siteDispatchedQuantity||0));if(values[i].received===''||!Number.isFinite(n)||n<previous||n>max)throw Error('Partida '+(i+1)+': recibe entre '+previous+' y '+max+'.');if(n>previous)changed=true;return {...l,received:n};});
 if(!changed)throw Error('Indica nuevas cantidades recibidas.');
 return {...p,lines,status:lines.every((l:R)=>Number(l.received||0)+Number(l.siteDispatchedQuantity||0)>=Number(l.quantity))?'Recibida':'Recepción parcial',warehouseReceivedBy:actor,warehouseReceivedAt:new Date().toISOString()};
}
export function dispatchPurchaseToSite(p:R,source:R,actor:string){
 if(!source||!receiptResponsible(source))throw Error('El envío a sitio requiere una solicitud de materiales con responsable de confirmar. Las compras directas de abastecimiento se reciben en Almacén.');
 if((source.deliveries||[]).some((d:R)=>d.status==='Diferencia'))throw Error('Resuelve primero la diferencia de recepción del solicitante.');
 let changed=false;const lines=p.lines.map((l:R)=>{const amount=Number(l.quantity)-Number(l.received||0)-Number(l.siteDispatchedQuantity||0);if(amount>0)changed=true;return {...l,siteDispatchedQuantity:Number(l.siteDispatchedQuantity||0)+Math.max(0,amount)};});if(!changed)throw Error('No hay cantidades pendientes de enviar a sitio.');
 const parentLines=source.lines.map((l:R)=>{const before=p.lines.find((x:R)=>x.id===l.id),after=lines.find((x:R)=>x.id===l.id);if(!before||!after)return l;const amount=Number(after.siteDispatchedQuantity)-Number(before.siteDispatchedQuantity||0);if(Number(l.delivered||0)+amount>Number(l.quantity)+.000001)throw Error('El envío supera la cantidad autorizada pendiente.');return {...l,physicalReceiptRequired:true,siteDelivered:Number(l.siteDelivered||0)+amount,delivered:Number(l.delivered||0)+amount,lastSuppliedBy:actor};});
 const next=recordMaterialDelivery({...source,lines:parentLines,status:materialStatus(parentLines)},source,actor);
 next.deliveries=next.deliveries.map((d:R)=>!(source.deliveries||[]).some((old:R)=>old.id===d.id)?{...d,route:'site',purchaseId:p.id,dueDate:receiptDeadline(p.expectedDeliveryDate&&p.expectedDeliveryDate>receiptToday()?p.expectedDeliveryDate:receiptToday())}:d);
 return {purchase:{...p,lines},source:next};
}
export function purchaseCycleStatus(p:R,source?:R){
 if(source?.status==='Completada y confirmada')return 'Ciclo cerrado · recepción confirmada';
 if(source?.deliveries?.some((d:R)=>d.status==='Diferencia'))return 'Diferencia por resolver';
 if(source?.deliveries?.some((d:R)=>d.status==='Pendiente'))return 'Por confirmar por el solicitante';
 if(p.procurementStatus==='Comprado'&&p.lines.some((l:R)=>Number(l.siteDispatchedQuantity||0)>0&&Number(l.siteDispatchedQuantity)<Number(l.quantity)))return 'Faltantes por reenviar a sitio';
 if(p.status==='Recibida')return source?'Recibida en Almacén · por surtir al proyecto':'Ciclo cerrado · recibida en Almacén';
 if(p.status==='Recepción parcial')return 'Recepción parcial de Almacén · faltantes pendientes';
 if(p.procurementStatus==='Entregado a almacén')return 'Por recibir en Almacén';
 if(p.procurementStatus==='Enviado a sitio')return 'Enviado a sitio · por confirmar';
 return p.procurementStatus||p.status;
}
