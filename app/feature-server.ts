import {materialSession} from './material-access';
import {env} from '@/server/runtime.mjs';
import {featureAllowed,featureGroups,FeatureState} from './feature-policy';
export async function readFeatures():Promise<FeatureState>{const r:any=await env.DB!.prepare("SELECT payload,revision FROM records WHERE id='feature-availability'").first();return r?{...JSON.parse(r.payload),revision:r.revision}:{revision:0,public:{}};}
export async function featureGuard(req:Request){const path=new URL(req.url).pathname;if(['/api/material-access','/api/support'].includes(path))return null;
 const local=await materialSession(req);if(local?.role==='Administrador')return null;
 const actor=req.headers.get('oai-authenticated-user-id');if(!local&&!actor)return null;
 if(!local){const owner:any=await env.DB!.prepare("SELECT payload FROM records WHERE id='system-admin'").first();if(owner&&JSON.parse(owner.payload).userId===actor)return null;}
 const state=await readFeatures();const profile={role:local?.role||'Usuario',features:state};let keys:string[]=[];
 if(path.includes('purchase-workspace'))keys=['materialPurchase'];
 else if(path.includes('material-')||path.includes('public-intake'))keys=['materialRequest'];
 else if(path.includes('caja-workspace')){if(!featureAllowed(profile,'cashAdvance')&&!featureAllowed(profile,'cashProof'))return Response.json({error:'Sistema caja privado.'},{status:403});}
 else if(path.includes('tickets'))keys=['ticketRequest'];else if(path.includes('flight-search'))keys=['flightComparison'];
 else if(path.includes('hr-incident'))keys=['hrIncident'];else if(path.includes('hr-assets'))keys=['employee'];else if(path.includes('quote-')||path.includes('examples/'))keys=['quote'];else if(path.includes('documents')||path.includes('transversal'))keys=['controlledDocument'];
 if(!['GET','HEAD'].includes(req.method)&&req.headers.get('content-type')?.includes('application/json')){try{const b:any=await req.clone().json();if(b.action==='saveComparison')keys.push('flightComparison');if(b.kind)keys.push(b.kind);if(b.record?.kind)keys.push(b.record.kind);if(/Proof|Excess/.test(b.action||''))keys.push('cashProof');if(/Advance/.test(b.action||''))keys.push('cashAdvance');if(b.action==='movement')keys.push('cashMovement');if(String(b.action).startsWith('material')){keys.push('materialRequest');if(['materialPurchase','materialConfirmPurchase','materialSupply'].includes(b.action))keys.push('materialPurchase');}if(b.action==='settlement')keys.push('settlement');}catch{}}
 return keys.some(k=>!featureAllowed(profile,k))?Response.json({error:'Esta función es privada y todavía no está disponible.'},{status:403}):null;
}
