import {isDirector} from './access-policy';
type R=Record<string,any>;
export const materialRouteChoices=[['review','Con autorización del responsable'],['warehouse','Directo a Almacén']];
export const viaticosRouteChoices=[['review','Visto bueno → Autorización → Aplicación'],['authorize','Autorización → Aplicación'],['apply','Directo a aplicación']];
export function requestRoutes(profile:R){const manager=profile.role==='Gerente'||/^geren(?:te|cia|cial)(?:\s|$)/.test(String(profile.level||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()),director=isDirector(profile),materialDefault=director||manager?'warehouse':'review',viaticosDefault=director?'apply':manager?'authorize':'review';return {material:profile.details?.materialRoute||materialDefault,viaticos:profile.details?.viaticosRoute||viaticosDefault};}
export function checkedRequestRouting(details:R){if(!['','review','warehouse'].includes(details.materialRoute||''))throw Error('Selecciona una ruta válida de Materiales.');if(!['','review','authorize','apply'].includes(details.viaticosRoute||''))throw Error('Selecciona una ruta válida de Viáticos.');}
export function requestRouteStamp(profile:R,actor:string){return {...requestRoutes(profile),level:profile.level||profile.role,configuredBy:profile.details?.requestRoutingConfiguredBy||'política del nivel',configuredAt:profile.details?.requestRoutingConfiguredAt||'',appliedAt:new Date().toISOString(),requestedBy:actor};}
export function skipsViaticosReview(r:R){return r.viaticosVersion===3&&['authorize','apply'].includes(r.viaticosRoute)&&r.requestRoutePolicy?.viaticos===r.viaticosRoute;}
export function directViaticosApplication(r:R){return skipsViaticosReview(r)&&r.viaticosRoute==='apply';}
