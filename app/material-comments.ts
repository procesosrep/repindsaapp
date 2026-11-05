import {hasAccess,isOwnRecord} from './access-policy';
import {canAccessMaterial,materialOwner} from './permissions';
type R=Record<string,any>;
export function materialCommentScope(c:R,id:string){const record=c.rows.find((r:R)=>r.id===id&&['materialRequest','materialPurchase'].includes(r.kind));if(!record||!canAccessMaterial(record,c.profile,c.rows))return null;const root=record.kind==='materialPurchase'&&record.sourceId?c.rows.find((r:R)=>r.id===record.sourceId&&r.kind==='materialRequest'):record;if(!root)return null;const canPost=record.status!=='Borrador'&&(isOwnRecord(root,c)||materialOwner(root,c.profile)||hasAccess(c.profile,'approveMaterials')||hasAccess(c.profile,'warehouse')||hasAccess(c.profile,'purchaseTracking'));return {record,root,canPost};}
export function materialCommentText(value:any){if(typeof value!=='string'||!value.trim()||value.trim().length>2000)throw Error('Escribe un comentario de hasta 2000 caracteres.');return value.trim();}

export function materialFollowupRecord(c:R,scope:R,id:string,text:string){return {id,kind:'materialFollowup',rootId:scope.root.id,sourceId:scope.record.id,rootFolio:scope.root.folio,name:'Seguimiento · '+scope.root.folio,projectId:scope.root.projectId||'',text:materialCommentText(text),createdBy:c.email,authorName:c.profile.name||c.username||c.email};}
