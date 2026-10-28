import {hasAccess} from './access-policy';
type R=Record<string,any>;
const normalize=(v:any)=>String(v||'').trim().toLowerCase();
export function suppressRequestNotifications(c:R){return [c.actualRole,c.profile?.role,c.profile?.level].some(value=>/^(administrador|administradora|direccion|director|directora)(\b|\s|$)/.test(normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')));}
export function notificationIdentity(value:any,c:R){const v=normalize(value);if(!v)return false;const ids=[c.userId,c.email,c.username,c.profile?.email].map(normalize).filter(Boolean);if(ids.includes(v))return true;const username=normalize(c.username||String(c.userId||'').match(/^local:(.+)$/)?.[1]);return !!username&&[username,'local:'+username,'usuario:'+username].includes(v);}
export function requestNotificationParticipation(r:R,c:R){if(suppressRequestNotifications(c))return {requester:false,approver:false,handler:false};const matches=(values:any[])=>values.some(value=>notificationIdentity(value,c));const requester=matches([r.createdBy,r.createdById,r.requesterId,r.ownerId,r.ownerEmail,r.receiptOwnerId,r.receiptOwnerEmail]);
 const material=r.kind==='materialRequest'||r.kind==='materialPurchase',cash=['cashAdvance','cashProof'].includes(r.kind),ticket=r.kind==='ticketRequest';
 const primary=r.assignedApprover||(material?c.routing?.materialApprover:cash?r.authorizationRole==='Gerente'?c.routing?.boxApprover:c.routing?.fallbackApprover:'');
 const approvalPermission=material?hasAccess(c.profile,'approveMaterials'):cash?hasAccess(c.profile,'approveBox'):false;
 const approver=approvalPermission&&matches([primary,r.managerApprovedBy,r.managerReviewedBy,r.approvedBy,r.reviewedBy]);
 const handlerPermission=material?(hasAccess(c.profile,'warehouse')||r.kind==='materialPurchase'&&hasAccess(c.profile,'purchaseTracking')):hasAccess(c.profile,'payments');
 const assigned=material?(r.kind==='materialPurchase'?(r.assignedBuyer||c.routing?.purchaseOperator||''):(r.assignedWarehouse||r.assignedHandler||c.routing?.warehouseOperator)):(r.assignedTreasury||r.assignedHandler||c.routing?.treasuryOperator);
 const actualHandlers=[r.handledBy,r.attendedBy,r.fulfilledBy,r.purchaseConfirmation?.actor,...(r.lines||[]).flatMap((l:R)=>[l.lastSuppliedBy,l.purchaseConfirmedBy])];
 for(const h of r.history||[])if(/almac[eé]n|compra|surtido|entrega|recepci[oó]n|pago|reembolso|gesti[oó]n/i.test(h.action||''))actualHandlers.push(h.actor);
 if(cash)for(const movement of c.rows||[])if(movement.kind==='cashMovement'&&(movement.advanceId===r.id||movement.proofId===r.id))actualHandlers.push(movement.createdBy,movement.createdById);
 const handler=(material||cash||ticket)&&handlerPermission&&matches([assigned,...actualHandlers]);return {requester,approver,handler};}
