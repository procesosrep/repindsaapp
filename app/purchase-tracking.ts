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
  if(!legacy&&(status!==previous&&!(allowed[previous]||[]).includes(status)||!['Emitida',...purchaseStages].includes(status)))throw Error('Partida '+(i+1)+': sigue el orden Cotizado → Comprado → Entrega.');
  if(old.standalone&&status==='Enviado a sitio'&&!legacy)throw Error('Las compras directas se reciben en Almacén.');
  if(Number(l.siteDispatchedQuantity||0)>0&&status==='Entregado a almacén')throw Error('Los faltantes de una partida enviada a sitio deben seguir la misma ruta.');
  const expected=String(d.expectedDeliveryDate??l.expectedDeliveryDate??old.expectedDeliveryDate??'');
  if(expected&&!validCashDate(expected)||status==='Comprado'&&(!expected||status!==previous&&expected<materialToday()))throw Error('Partida '+(i+1)+': indica una fecha de entrega aproximada válida.');
  const detail:R={procurementNotes:String(d.procurementNotes??l.procurementNotes??'').trim().slice(0,1200)};
  for(const key of ['reportedQuantity','unitPrice']){const value=d[key]??l[key]??'';if(value!==''&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1e12))throw Error('Partida '+(i+1)+': revisa cantidades y precios.');detail[key]=value===''?'':Number(value);}
  return {...l,...detail,procurementStatus:status,expectedDeliveryDate:expected,...(status==='Comprado'?{purchasedQuantity:Math.max(Number(l.purchasedQuantity||0),Number(l.quantity))}:{} )};
 });
 const states=lines.map((l:R)=>l.procurementStatus),status=states.includes('Emitida')?'Emitida':states.includes('Cotizado')?'Cotizado':states.includes('Comprado')?'Comprado':states.every((s:string)=>s==='Enviado a sitio')?'Enviado a sitio':'Entregado a almacén',dates=lines.map((l:R)=>l.expectedDeliveryDate).filter(Boolean).sort(),expected=dates.at(-1)||'',notes=String(data.procurementNotes??old.procurementNotes??'').trim().slice(0,1200);
 if(JSON.stringify(lines)===JSON.stringify(old.lines)&&notes===(old.procurementNotes||''))throw Error('No hay cambios de seguimiento para guardar.');
 return {...old,lines,procurementStatus:status,expectedDeliveryDate:expected,procurementNotes:notes,procurementUpdatedAt:now,procurementUpdatedBy:actor,assignedBuyer:old.assignedBuyer||actor.replace(/^usuario:/,'')};
}
