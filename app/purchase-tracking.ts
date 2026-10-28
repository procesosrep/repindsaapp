import {validCashDate} from './cash-model';
import {materialToday} from './material-model';
type R=Record<string,any>;
export const purchaseStages=['Cotizado','Comprado','Entregado a almacén','Enviado a sitio'];
export function updatePurchaseTracking(old:R,data:R,actor:string){
 if(old.status==='Borrador'||old.status==='Recibida')throw Error('La compra debe estar emitida y abierta para actualizar el seguimiento.');
 const previous=old.procurementStatus||'Emitida',status=String(data.procurementStatus||''),allowed:R={'Emitida':['Cotizado'],'Cotizado':['Comprado'],'Comprado':['Entregado a almacén','Enviado a sitio']};
 const legacyDirect=old.standalone&&previous==='Enviado a sitio'&&status==='Entregado a almacén';if(legacyDirect&&!String(data.procurementNotes||'').trim())throw Error('Documenta cómo se reconduce esta compra directa para su recepción en Almacén.');
 if(!legacyDirect&&(!purchaseStages.includes(status)||!(allowed[previous]||[]).includes(status)&&!(previous==='Comprado'&&status==='Comprado')))throw Error('Sigue el orden: Cotizado → Comprado → Entregado a almacén o Enviado a sitio.');
 const expected=String(data.expectedDeliveryDate||old.expectedDeliveryDate||'');
 if(status==='Comprado'&&(!validCashDate(expected)||expected<materialToday()))throw Error('Indica una fecha de entrega aproximada válida, de hoy en adelante.');
 const notes=String(data.procurementNotes||'').trim().slice(0,1200);
 if(previous===status&&expected===old.expectedDeliveryDate&&notes===(old.procurementNotes||''))throw Error('No hay cambios de seguimiento para guardar.');
 return {...old,...(status==='Comprado'?{lines:old.lines.map((l:R)=>({...l,purchasedQuantity:Math.max(Number(l.purchasedQuantity||0),Number(l.quantity))}))}:{}),procurementStatus:status,expectedDeliveryDate:expected,procurementNotes:notes,procurementUpdatedAt:new Date().toISOString(),procurementUpdatedBy:actor,assignedBuyer:old.assignedBuyer||actor.replace(/^usuario:/,'')};
}
