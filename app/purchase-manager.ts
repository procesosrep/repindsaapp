import {env} from '@/server/runtime.mjs';
import {accessPermissionKeys} from './access-policy';
export async function provisionPurchaseManager(db:any){
 const raw=(env as any).PURCHASE_MANAGER_PEDRO;if(!raw)return;
 const seed=JSON.parse(raw),marker='purchase-manager-pedro-v1';
 if(await db.prepare('SELECT id FROM records WHERE id=?').bind(marker).first())return;
 if(!seed.salt||!seed.hash)throw Error('Configuración de Compras incompleta.');
 // Never overwrite an account or reset a password on subsequent logins.
 if(await db.prepare("SELECT username FROM material_users WHERE username='pedro'").first())return;
 const routingRow:any=await db.prepare("SELECT payload FROM records WHERE id='access-routing'").first();const routing={...(routingRow?JSON.parse(routingRow.payload):{id:'access-routing',kind:'config'}),purchaseOperator:'pedro',updatedBy:'sistema'};
 const now=new Date().toISOString(),rights=Object.fromEntries(accessPermissionKeys.map(k=>[k,['materials','purchaseTracking'].includes(k)])),details={position:'Gerente de compras'};
 const member={id:'local-member-pedro',kind:'membership',email:'usuario:pedro',name:'Pedro',role:'Compras',level:'Gerente de compras',rights,details,status:'Activo',history:[{date:now,actor:'sistema',action:'Usuario Pedro creado para seguimiento de compras; sin autorización',status:'Activo'}]};
 await db.batch([
 db.prepare("INSERT INTO records(id,kind,payload,revision,updated) VALUES('access-routing','config',?,1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=records.revision+1,updated=excluded.updated").bind(JSON.stringify(routing),now),
 db.prepare("INSERT INTO material_users(username,name,role,salt,hash,must_change,active) VALUES('pedro','Pedro','Compras',?,?,1,1)").bind(seed.salt,seed.hash),
 db.prepare("INSERT INTO material_user_profiles(username,level,rights,details) VALUES('pedro','Gerente de compras',?,?)").bind(JSON.stringify(rights),JSON.stringify(details)),
 db.prepare("INSERT OR IGNORE INTO material_levels(name,base_role,rights) VALUES('Gerente de compras','Compras',?)").bind(JSON.stringify(rights)),
 db.prepare('INSERT INTO records(id,kind,payload,revision,updated) VALUES(?,?,?,1,?)').bind(member.id,'membership',JSON.stringify(member),now),
 db.prepare("INSERT INTO records(id,kind,payload,revision,updated) VALUES('purchase-manager-pedro-v1','config',?,1,?)").bind(JSON.stringify({id:marker,kind:'config',name:'Gerente de compras habilitado',date:now}),now)
 ]);
}
