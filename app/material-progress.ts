import {materialApproved} from './material-model';
type R=Record<string,any>;
export function materialProgressSteps(r:R){
 const draft=r.status==='Borrador',rejected=r.status==='Rechazada',direct=r.materialRoute==='warehouse'&&r.requestRoutePolicy?.material==='warehouse'&&!!r.materialReleasedAt,approved=!draft&&!rejected&&materialApproved(r),lines=(r.lines||[]).filter((l:R)=>l.status!=='Rechazada'&&Number(l.quantity)>0),confirmed=r.status==='Completada y confirmada',delivered=confirmed||lines.length>0&&lines.every((l:R)=>Number(l.delivered||0)>=Number(l.quantity));
 const current=rejected?-1:draft?0:!approved?1:!delivered?2:!confirmed?3:-1;
 return [{label:'Solicitud registrada',done:!draft},{label:direct?'Autorización no requerida · Ruta directa':'Autorización del responsable',done:approved},{label:'Entrega de Almacén',done:delivered},{label:'Recepción confirmada',done:confirmed}].map((step,i)=>({...step,current:i===current}));
}
