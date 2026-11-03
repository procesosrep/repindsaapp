import {purchaseLineProgress} from './purchase-progress';
import {validCashDate} from './cash-model';
import {materialToday} from './material-model';
type R=Record<string,any>;
export const purchaseStages=['Cotizado','Comprado','Entregado a almacén','Enviado a sitio'];
export function updatePurchaseTracking(old:R,data:R,actor:string){
 if(old.status==='Borrador'||old.status==='Recibida')throw Error('La compra debe estar emitida y abierta para actualizar el seguimiento.');
 const now=new Date().toISOString(),allowed:R={'Emitida':['Cotizado'],'Cotizado':['Comprado'],'Comprado':['Entregado a almacén','Enviado a sitio']};
 const perLine=!data.procurementStatus;
 if(perLine&&data.lines!==undefined&&(!Array.isArray(data.lines)||data.lines.length!==old.lines.length||data.lines.some((l:R,i:number)=>l.id!==old.lines[i].id)))throw Error('Conserva las partidas originales y su orden.');
 const lines=old.lines.map((l:R,i:number)=>{
  const d=perLine?(data.lines?.[i]||data):data,previous=l.procurementStatus||old.procurementStatus||'Emitida',status=String(d.procurementStatus||previous),legacy=old.standalone&&previous==='Enviado a sitio'&&status==='Entregado a almacén';
  if(legacy&&!String(d.procurementNotes||data.procurementNotes||'').trim())throw Error('Documenta cómo se reconduce esta compra directa para su recepción en Almacén.');
  const prior=purchaseLineProgress(l,old),reopen=['Entregado a almacén','Enviado a sitio'].includes(previous)&&status==='Comprado'&&(prior.toBuy>0||prior.pending>0);
  if(!legacy&&(!reopen&&status!==previous&&!(allowed[previous]||[]).includes(status)||!['Emitida',...purchaseStages].includes(status)))throw Error('Partida '+(i+1)+': sigue el orden Cotizado → Comprado → Entrega.');
  if(old.standalone&&status==='Enviado a sitio'&&!legacy)throw Error('Las compras directas se reciben en Almacén.');
  if(prior.site>0&&status==='Entregado a almacén')throw Error('Los faltantes de una partida enviada a sitio deben seguir la misma ruta.');
  if(prior.warehouse>0&&status==='Enviado a sitio')throw Error('Las cantidades de esta partida ya destinadas a Almacén deben conservar su ruta.');
  const supplied=d.purchasedQuantity;if(supplied===''||data.quantityTrackingVersion===1&&Number(supplied)===0&&status==='Comprado')throw Error('Partida '+(i+1)+': indica una cantidad comprada mayor a cero.');const purchased=(supplied===undefined||data.quantityTrackingVersion!==1&&status==='Comprado'&&previous!=='Comprado'&&Number(supplied)===prior.bought)?(status==='Comprado'&&previous!=='Comprado'?Number(l.quantity):prior.bought):Number(supplied);if(!Number.isFinite(purchased)||purchased<prior.bought-.000001||purchased>Number(l.quantity)+.000001)throw Error('Partida '+(i+1)+': la cantidad comprada debe estar entre '+prior.bought+' y '+l.quantity+'.');if(purchased>prior.bought&& !['Comprado','Entregado a almacén','Enviado a sitio'].includes(status))throw Error('Primero registra la compra de esta partida.');
  const implicitWarehouse=d.warehouseSentQuantity===undefined||data.quantityTrackingVersion!==1&&previous!=='Entregado a almacén'&&Number(d.warehouseSentQuantity)===prior.warehouse,implicitSite=d.siteSendQuantity===undefined||data.quantityTrackingVersion!==1&&previous!=='Enviado a sitio'&&Number(d.siteSendQuantity)===prior.site;const warehouse=status==='Entregado a almacén'?(implicitWarehouse?Math.max(prior.warehouse,purchased-prior.site):Number(d.warehouseSentQuantity)):prior.warehouse,site=status==='Enviado a sitio'?(implicitSite?Math.max(prior.site,purchased-prior.warehouse):Number(d.siteSendQuantity)):prior.site;if(![warehouse,site].every(Number.isFinite)||warehouse<prior.warehouse||site<prior.site||warehouse+site>purchased+.000001)throw Error('Partida '+(i+1)+': el envío no puede superar lo comprado ni reducir envíos anteriores.');
  const expected=String(d.expectedDeliveryDate??l.expectedDeliveryDate??old.expectedDeliveryDate??'');
  if(expected&&!validCashDate(expected)||status==='Comprado'&&(!expected||status!==previous&&expected<materialToday()))throw Error('Partida '+(i+1)+': indica una fecha de entrega aproximada válida.');
  const detail:R={procurementNotes:String(d.procurementNotes??l.procurementNotes??'').trim().slice(0,1200)};
  for(const key of ['reportedQuantity','unitPrice']){const value=d[key]??l[key]??'';if(value!==''&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1e12))throw Error('Partida '+(i+1)+': revisa cantidades y precios.');detail[key]=value===''?'':Number(value);}
  return {...l,...detail,procurementStatus:status,expectedDeliveryDate:expected,purchasedQuantity:purchased,warehouseSentQuantity:warehouse,siteSendQuantity:site};
 });
 const states=lines.map((l:R)=>l.procurementStatus),status=states.includes('Emitida')?'Emitida':states.includes('Cotizado')?'Cotizado':states.includes('Comprado')?'Comprado':states.every((s:string)=>s==='Enviado a sitio')?'Enviado a sitio':'Entregado a almacén',dates=lines.map((l:R)=>l.expectedDeliveryDate).filter(Boolean).sort(),expected=dates.at(-1)||'',notes=String(data.procurementNotes??old.procurementNotes??'').trim().slice(0,1200);
 if(JSON.stringify(lines)===JSON.stringify(old.lines)&&notes===(old.procurementNotes||''))throw Error('No hay cambios de seguimiento para guardar.');
 return {...old,lines,procurementStatus:status,expectedDeliveryDate:expected,procurementNotes:notes,procurementUpdatedAt:now,procurementUpdatedBy:actor,assignedBuyer:old.assignedBuyer||actor.replace(/^usuario:/,'')};
}
