import {hasAccess} from './access-policy';
type R=Record<string,any>;
export function canAuthorDocument(profile:R){return profile.role==='Administrador'||(hasAccess(profile,'documentsEdit')||hasAccess(profile,'editRecords'))&&(hasAccess(profile,'documentsView')||hasAccess(profile,'transversal'));}
export function documentParticipant(r:R,profile:R){const username=String(profile.userId||'').replace(/^local:/,'');return profile.role==='Administrador'||r.createdBy===profile.email||r.documentReviewer===username&&['En revisión de Procesos','En autorización de Dirección','Devuelto con comentarios','Vigente'].includes(r.status)||r.documentApprover===username&&['En autorización de Dirección','Vigente'].includes(r.status);}
export function officialDocument(r:R){const source=r.status==='Vigente'?r:r.publishedSnapshot;if(!source)return null;return {...source,id:r.id,kind:'controlledDocument',status:'Vigente',history:undefined,reviewComment:undefined,documentReviewer:undefined,documentApprover:undefined,reviewedBy:undefined,returnedBy:undefined,publishedSnapshot:undefined};}
export const documentPending=['En revisión de Procesos','En autorización de Dirección'];
