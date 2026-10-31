import {accessKind,isDirector,accessRights} from './access-policy';
export const featureGroups=[
 {key:'workspaces',name:'Acceso a espacios',items:[['workspaceCaja','Botón Viáticos'],['workspacePanel','Botón Panel completo']]},
 {key:'cycle1',name:'Comercial',items:[['opportunity','Oportunidades'],['quote','Cotizaciones'],['client','Clientes'],['concept','Conceptos'],['commercial','Contratos y seguimiento']]},
 {key:'cycle2',name:'Operaciones',items:[['project','Proyectos'],['operation','Planeación y ejecución'],['requirement','Requerimientos']]},
 {key:'cycle3',name:'Suministros',items:[['materialRequest','Solicitudes de materiales'],['materialPurchase','Compras y surtido'],['resource','Catálogos']]},
 {key:'cycle4',name:'Recursos Humanos',items:[['recruitment','Reclutamiento'],['candidate','Candidatos'],['employee','Personal y expedientes'],['hrIncident','Incidentes y seguimiento laboral'],['laborContract','Contratos laborales'],['settlement','Finiquito y liquidación'],['ticketRequest','Boletos'],['flightComparison','Cotizar vuelos'],['camp','Campamentos'],['transfer','Traslados'],['travel','Viáticos'],['program','Programas']]},
 {key:'cycle5',name:'Finanzas y Caja',items:[['fuelLog','Control de combustible'],['cashAdvance','Anticipos'],['cashProof','Comprobaciones'],['cashMovement','Tesorería y pagos'],['cashAccount','Cuentas de caja'],['payment','Pagos']]},
 {key:'transversal',name:'Transversal',items:[['controlledDocument','Documentos'],['controlledAsset','Archivos documentales']]}
];
export type FeatureState={revision:number,public:Record<string,boolean>};
export function featureOpen(state:FeatureState|undefined,key:string){return ['workspaceCaja','workspacePanel'].includes(key)?state?.public?.[key]===true:state?.public?.[key]!==false;}
export function featureAllowed(profile:any,kind:string){if(profile.role==='Administrador'||isDirector(profile))return true;const key=accessKind(kind);return featureOpen(profile.features,key)&&featureOpen(profile.features,kind);}
export function featureProfile(profile:any,state:FeatureState){return {...profile,features:state};}

// Workspace navigation follows assigned permissions. Legacy button-publication flags
// must not strand a valid session; module/function publication remains enforced.
export function workspaceVisible(profile:any,system:string){if(profile.role==='Administrador'||profile.actualRole==='Administrador'||isDirector(profile))return true;const rights=accessRights(profile);if(system==='operaciones')return !!rights.panel;if(system==='caja')return !!(rights.box||rights.payments)&&(featureAllowed(profile,'cashAdvance')||featureAllowed(profile,'cashProof'));if(system==='materiales')return !!rights.materials&&featureAllowed(profile,'materialRequest');if(system==='documentos')return !!rights.documentsView&&featureAllowed(profile,'controlledDocument');return false;}
