import {purchaseLineProgress} from './purchase-progress';
import {hasAccess} from './access-policy';
type R=Record<string,any>;
const normalize=(v:any)=>String(v||'').trim().toLowerCase();
export function financialNotificationRecipient(c:R){return [c.actualRole,c.profile?.role,c.profile?.level].some(value=>/^(direccion|director|directora|tesoreria)(\b|\s|$)/.test(normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')));}
export function suppressRequestNotifications(c:R){return [c.actualRole,c.profile?.role,c.profile?.level].some(value=>/^(administrador|administradora|direccion|director|directora)(\b|\s|$)/.test(normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')));}
export function notificationIdentity(value:any,c:R){const v=normalize(value);if(!v)return false;const ids=[c.userId,c.email,c.username,c.profile?.email].map(normalize).filter(Boolean);if(ids.includes(v))return true;const username=normalize(c.username||String(c.userId||'').match(/^local:(.+)$/)?.[1]);return !!username&&[username,'local:'+username,'usuario:'+username].includes(v);}
export function requestNotificationParticipation(r:R,c:R){if(suppressRequestNotifications(c)&&!(financialNotificationRecipient(c)&&['cashAdvance','cashProof','ticketRequest'].includes(r.kind)))return {requester:false,approver:false,handler:false};const matches=(values:any[])=>values.some(value=>notificationIdentity(value,c));const requester=matches([r.createdBy,r.createdById,r.requesterId,r.ownerId,r.ownerEmail,r.receiptOwnerId,r.receiptOwnerEmail]);
 const material=r.kind==='materialRequest'||r.kind==='materialPurchase',cash=['cashAdvance','cashProof'].includes(r.kind),ticket=r.kind==='ticketRequest';
 const primary=(r.viaticosVersion===3?(r.viaticosStage==='Visto bueno'?r.viaticosReviewer:(r.viaticosAuthorizers||[])[0]):r.assignedApprover)||(material?c.routing?.materialApprover:cash?r.authorizationRole==='Gerente'?c.routing?.boxApprover:c.routing?.fallbackApprover:'');
 const approvalPermission=material?hasAccess(c.profile,'approveMaterials'):cash?(hasAccess(c.profile,'approveBox')||r.viaticosVersion===3&&r.viaticosStage==='Visto bueno'&&hasAccess(c.profile,'reviewBox')):false;
 const ticketDirector=ticket&&financialNotificationRecipient(c)&&hasAccess(c.profile,'box')&&hasAccess(c.profile,'viewAll');
 const approver=ticketDirector||approvalPermission&&matches([primary,...(r.viaticosVersion===3&&r.viaticosStage==='Autorización'?r.viaticosAuthorizers||[]:[]),r.managerApprovedBy,r.managerReviewedBy,r.approvedBy,r.reviewedBy]);
 const handlerPermission=material?(hasAccess(c.profile,'warehouse')||r.kind==='materialPurchase'&&hasAccess(c.profile,'purchaseTracking')):hasAccess(c.profile,'payments');
 const assigned=material?(r.kind==='materialPurchase'?(r.assignedBuyer||c.routing?.purchaseOperator||''):(r.assignedWarehouse||r.assignedHandler||c.routing?.warehouseOperator)):(r.assignedTreasury||r.assignedHandler||c.routing?.treasuryOperator);
 const actualHandlers=[r.handledBy,r.attendedBy,r.fulfilledBy,r.purchaseConfirmation?.actor,...(r.lines||[]).flatMap((l:R)=>[l.lastSuppliedBy,l.purchaseConfirmedBy])];
 for(const h of r.history||[])if(/almac[eé]n|compra|surtido|entrega|recepci[oó]n|pago|reembolso|gesti[oó]n/i.test(h.action||''))actualHandlers.push(h.actor);
 if(cash)for(const movement of c.rows||[])if(movement.kind==='cashMovement'&&(movement.advanceId===r.id||movement.proofId===r.id))actualHandlers.push(movement.createdBy,movement.createdById);
 const unassignedFinancial=financialNotificationRecipient(c)&&!assigned&&(ticket||cash&&(r.viaticosVersion===3?!!r.approvedAt:['Aprobada','Cerrada'].includes(r.status)));const handler=(material||cash||ticket)&&handlerPermission&&(unassignedFinancial||matches([assigned,...actualHandlers]));return {requester,approver,handler};}
// Status notices belong to the current action, not to every previous participant.
// Owners still receive results; receipt/deadline reminders are handled separately.
export function requestNotificationNeedsAction(r:R,c:R,participation?:R){
 const p=participation||requestNotificationParticipation(r,c);if(p.requester)return true;
 if(['cashAdvance','cashProof'].includes(r.kind)){
  if(r.viaticosVersion===3){
   if(r.viaticosStage==='Visto bueno')return notificationIdentity(r.viaticosReviewer,c)&&(hasAccess(c.profile,'reviewBox')||hasAccess(c.profile,'approveBox'));
   if(r.viaticosStage==='Autorización')return hasAccess(c.profile,'approveBox')&&(r.viaticosAuthorizers||[]).some((v:any)=>notificationIdentity(v,c));
   const director=[c.actualRole,c.profile?.role,c.profile?.level].some(v=>/^(direccion|director|directora)(\b|\s|$)/.test(normalize(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'')));
   const assignedPay=notificationIdentity(r.assignedTreasury||r.assignedHandler||c.routing?.treasuryOperator,c);return (!director||assignedPay)&&p.handler&&hasAccess(c.profile,'payments')&&r.viaticosStage==='Aplicar'&&!!r.approvedAt;
  }
  return !['Cerrada','Rechazada','Cancelada'].includes(r.status)&&(p.approver||p.handler);
 }
 if(r.kind==='ticketRequest'){
  if(r.status==='Solicitada')return p.approver||p.handler;
  const handler=r.handledBy||(r.history||[]).filter((h:R)=>h.action==='Compra en gestión').at(-1)?.actor||r.assignedTreasury||c.routing?.treasuryOperator;
  return r.status==='En gestión'&&p.handler&&notificationIdentity(handler,c);
 }
 if(['materialRequest','materialPurchase'].includes(r.kind)){
  if(['Completada y confirmada','Completada','Atendida','Recibida','Rechazada','Cancelada'].includes(r.status))return false;
  if(p.handler){if(r.kind==='materialRequest'&&r.lines?.length)return r.lines.some((l:R)=>Number(l.delivered||0)+.000001<Number(l.quantity||0))||r.status==='Diferencia reportada'||(r.deliveries||[]).some((d:R)=>d.status==='Diferencia');if(r.kind==='materialPurchase'&&r.lines?.length&&hasAccess(c.profile,'purchaseTracking')&&!hasAccess(c.profile,'warehouse'))return r.lines.some((l:R)=>{const progress=purchaseLineProgress(l,r);return progress.toBuy>.000001||progress.toSend>.000001});return true;}
  return p.approver&&['Pendiente de autorización','Pendiente de visto bueno'].includes(r.status);
 }
 return true;
}
