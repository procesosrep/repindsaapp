import {accessKind} from './access-policy';
export const featureGroups=[
 {key:'workspaces',name:'Acceso a espacios',items:[['workspaceCaja','Botón Sistema caja'],['workspacePanel','Botón Panel completo']]},
 {key:'cycle1',name:'Comercial',items:[['opportunity','Oportunidades'],['quote','Cotizaciones'],['client','Clientes'],['concept','Conceptos'],['commercial','Contratos y seguimiento']]},
 {key:'cycle2',name:'Operaciones',items:[['project','Proyectos'],['operation','Planeación y ejecución'],['requirement','Requerimientos']]},
 {key:'cycle3',name:'Suministros',items:[['materialRequest','Solicitudes de materiales'],['materialPurchase','Compras y surtido'],['resource','Catálogos']]},
 {key:'cycle4',name:'Recursos Humanos',items:[['recruitment','Reclutamiento'],['candidate','Candidatos'],['employee','Personal y expedientes'],['hrIncident','Incidentes y seguimiento laboral'],['laborContract','Contratos laborales'],['settlement','Finiquito y liquidación'],['ticketRequest','Boletos'],['flightComparison','Cotizar vuelos'],['camp','Campamentos'],['transfer','Traslados'],['travel','Viáticos'],['program','Programas']]},
 {key:'cycle5',name:'Finanzas y Caja',items:[['cashAdvance','Anticipos'],['cashProof','Comprobaciones'],['cashMovement','Tesorería y pagos'],['cashAccount','Cuentas de caja'],['payment','Pagos']]},
 {key:'transversal',name:'Transversal',items:[['controlledDocument','Documentos'],['controlledAsset','Archivos documentales']]}
];
export type FeatureState={revision:number,public:Record<string,boolean>};
export function featureOpen(state:FeatureState|undefined,key:string){return ['workspaceCaja','workspacePanel'].includes(key)?state?.public?.[key]===true:state?.public?.[key]!==false;}
export function featureAllowed(profile:any,kind:string){if(profile.role==='Administrador')return true;const key=accessKind(kind);return featureOpen(profile.features,key)&&featureOpen(profile.features,kind);}
export function featureProfile(profile:any,state:FeatureState){return {...profile,features:state};}

export function workspaceVisible(profile:any,system:string){if(profile.role==='Administrador'||profile.actualRole==='Administrador')return true;const state=profile.features;if(system==='caja')return featureOpen(state,'workspaces')&&featureOpen(state,'workspaceCaja')&&(featureAllowed(profile,'cashAdvance')||featureAllowed(profile,'cashProof'));if(system==='operaciones')return featureOpen(state,'workspaces')&&featureOpen(state,'workspacePanel');return true;}
