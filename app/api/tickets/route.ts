import {isActiveProject} from '../../active-projects-view';
import {featureGuard} from '../../feature-server';
import {hasAccess} from '../../access-policy';
import {cashContext,cashFail,cashFolio,storeCash,cashOwned} from '../../cash-server';
import {inScope} from '../../permissions';
import {featureAllowed} from '../../feature-policy';
import {today} from '../../workflow-utils';
const reply=(value:any,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){const unavailable=await featureGuard(req);if(unavailable)return unavailable;const c=await cashContext(req);if(!c)return cashFail('Inicia sesión.',401);const canRequest=featureAllowed(c.profile,'ticketRequest')&&hasAccess(c.profile,'requestTickets')&&(hasAccess(c.profile,'box')||['Administrador','Recursos Humanos'].includes(c.profile.role)&&hasAccess(c.profile,'editRecords')),canPay=hasAccess(c.profile,'payments');if(!canRequest&&!canPay&&!hasAccess(c.profile,'box'))return cashFail('Sin acceso a boletos.',403);const tickets=c.rows.filter((r:any)=>r.kind==='ticketRequest'&&cashOwned(r,c)),ids=new Set(tickets.map((r:any)=>r.id));return reply({records:[...tickets,...c.rows.filter((r:any)=>r.kind==='cashAttachment'&&ids.has(r.ownerId)).map((r:any)=>({...r,key:undefined})),...c.rows.filter((r:any)=>isActiveProject(r)&&inScope(r,c.profile,c.rows)).map((r:any)=>({id:r.id,kind:r.kind,name:r.name,status:r.status,folio:r.folio})),...(canRequest?c.rows.filter((r:any)=>inScope(r,c.profile,c.rows)&&(r.kind==='employee'&&!['Baja','Inactivo','Dado de baja'].includes(r.status)||r.kind==='candidate'&&['Contratación','Apto','Traslado','Seleccionado','Contratado','Incorporado'].includes(r.status))).map((r:any)=>({id:r.id,kind:r.kind,name:r.name,folio:r.folio,status:r.status,birthDate:r.birthDate,phone:r.phone,email:r.email,projectId:r.projectId})):[])],user:{username:c.username,email:c.email,name:c.profile.name,role:c.actualRole},permissions:{requestTickets:canRequest,payments:canPay}})}
export async function POST(req:Request){const unavailable=await featureGuard(req);if(unavailable)return unavailable;
 const c=await cashContext(req);if(!c)return cashFail('Inicia sesión.',401);
 const role=c.profile.role,rh=['Administrador','Recursos Humanos'].includes(role)&&(!c.profile.rights||hasAccess(c.profile,'editRecords')),treasury=c.profile.rights?hasAccess(c.profile,'payments'):['Administrador','Tesorería'].includes(role);
 const requestTickets=featureAllowed(c.profile,'ticketRequest')&&hasAccess(c.profile,'requestTickets')&&(rh||hasAccess(c.profile,'box'));if(!rh&&!treasury&&!requestTickets)return cashFail('Sin permiso.',403);
 if(req.headers.get('Origin')&&req.headers.get('Origin')!==new URL(process.env.APP_ORIGIN||req.url).origin)return cashFail('Origen no permitido.',403);
 try{const b:any=await req.json();if(b.expectedOwner&&b.expectedOwner!==c.email)return cashFail('La sesión cambió. Vuelve a abrir Boletos.',409);
 if(b.action==='saveComparison'){if(!rh&&!treasury)return cashFail('Sin permiso para comparar tarifas.',403);
 const d=b.data||{},prior=b.id?c.rows.find((x:any)=>x.id===b.id&&x.kind==='flightComparison'):undefined;
 if(b.id&&!prior)return cashFail('Comparación no encontrada.',404);
 if(prior&&(!inScope(prior,c.profile,c.rows)||Number(b.revision)!==prior.revision))return cashFail('Actualiza la comparación antes de continuar.',409);
 const source=d.ticketId?c.rows.find((x:any)=>x.id===d.ticketId&&x.kind==='ticketRequest'):null;
 if(d.ticketId&&(!source||!inScope(source,c.profile,c.rows)))return cashFail('Solicitud fuera de alcance.',403);
 if(!String(d.origin||'').trim()||!String(d.destination||'').trim()||!/^\d{4}-\d{2}-\d{2}$/.test(d.travelDate||''))return cashFail('Completa ruta y fecha.');
 const opts=Array.isArray(d.options)?d.options:[];
 if(!opts.length||opts.length>20)return cashFail('Agrega de 1 a 20 alternativas.');
 const options=[];for(const o of opts){if(!['Aeroméxico','Volaris','Viva Aerobus','Otra'].includes(o.airline)||!Number.isFinite(Number(o.total))||Number(o.total)<=0||!String(o.baggage||'').trim()||!String(o.schedule||'').trim())return cashFail('Cada alternativa requiere aerolínea, horario, equipaje e importe total positivo.');options.push({airline:o.airline,total:Math.round(Number(o.total)*100)/100,schedule:String(o.schedule).slice(0,200),baggage:String(o.baggage).slice(0,500),conditions:String(o.conditions||'').slice(0,1000),consultedAt:prior?.options?.find((x:any)=>JSON.stringify({...x,consultedAt:undefined})===JSON.stringify({...o,consultedAt:undefined}))?.consultedAt||new Date().toISOString()});}
 const r={id:prior?.id||crypto.randomUUID(),kind:'flightComparison',folio:prior?.folio||await cashFolio(c.db,'CV'),name:String(d.origin).slice(0,150)+' → '+String(d.destination).slice(0,150),origin:String(d.origin).slice(0,150),destination:String(d.destination).slice(0,150),travelDate:d.travelDate,returnDate:String(d.returnDate||'').slice(0,10),passengers:Math.min(99,Math.max(1,Number(d.passengers)||1)),ticketId:source?.id||'',projectId:source?.projectId||'',division:source?.division||c.profile.division||'',options,createdBy:prior?.createdBy||c.email,status:'Comparativa',sourceMode:'Consulta manual en sitio oficial'};
 return Response.json({record:await storeCash(c.db,r,prior,c.email,'Comparación de tarifas guardada')});
 }
 const old=c.rows.find((r:any)=>r.id===b.id&&r.kind==='ticketRequest');
 if(b.id&&!old)return cashFail('Solicitud no encontrada.',404);
 if(old&&!inScope(old,c.profile,c.rows))return cashFail('Fuera de tu alcance.',403);
 if(old&&Number(b.revision)!==old.revision)return cashFail('La solicitud cambió. Actualiza la página.',409);
 let r:any,action='';
 if(b.action==='send'){
 if(!requestTickets)return cashFail('Necesitas acceso a Viáticos para solicitar boletos.',403);if(old&&!rh&&old.createdBy!==c.email)return cashFail('Sólo puedes corregir tus propias solicitudes.',403);
 if(old&&!['Devuelta'].includes(old.status))return cashFail('Esta solicitud ya fue enviada.',409);
 const d=b.data||{},person=c.rows.find((x:any)=>x.id===d.personId&&['candidate','employee'].includes(x.kind));
 if(!person||!inScope(person,c.profile,c.rows))return cashFail('Selecciona personal o un candidato de tu alcance.');
 if(person.kind==='candidate'&&!['Contratación','Apto','Traslado','Seleccionado','Contratado','Incorporado'].includes(person.status))return cashFail('El candidato debe estar seleccionado o apto para el traslado.');
 if(person.kind==='employee'&&['Baja','Inactivo','Dado de baja'].includes(person.status))return cashFail('Selecciona personal activo.');
 const project=d.projectId?c.rows.find((x:any)=>x.id===d.projectId&&x.kind==='project'):null;
 if(d.projectId&&(!project||!inScope(project,c.profile,c.rows)))return cashFail('Proyecto no disponible.');
 const birthDate=String(d.birthDate||person.birthDate||''),validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!validDate(birthDate)||birthDate>=today())return cashFail('Revisa la fecha de nacimiento.');
 if(!validDate(d.travelDate)||d.travelDate<today())return cashFail('La salida debe ser hoy o una fecha futura.');
 if(!['Autobús','Avión'].includes(d.transport)||!['Sencillo','Redondo'].includes(d.tripType))return cashFail('Selecciona transporte y tipo de viaje.');
 if(!['Incorporación a proyecto','Traslado a proyecto','Descanso','Regreso de descanso','Otro'].includes(d.reason))return cashFail('Selecciona el motivo.');
 if(d.reason==='Otro'&&!String(d.otherReason||'').trim())return cashFail('Especifica el motivo del viaje.');
 for(const k of ['origin','destination','contact','baggage','preferredTime'])if(!String(d[k]||'').trim())return cashFail('Completa origen, destino, contacto, equipaje y horario preferente.');
 if(d.origin.trim().toLowerCase()===d.destination.trim().toLowerCase())return cashFail('Origen y destino deben ser distintos.');
 if(d.tripType==='Redondo'&&(!validDate(d.returnDate)||d.returnDate<d.travelDate||!d.returnTime))return cashFail('Revisa fecha y horario de regreso.');
 if(c.rows.some((x:any)=>x.kind==='ticketRequest'&&x.id!==old?.id&&x.personId===person.id&&x.travelDate===d.travelDate&&x.origin?.trim().toLowerCase()===d.origin.trim().toLowerCase()&&x.destination?.trim().toLowerCase()===d.destination.trim().toLowerCase()&&x.status!=='Cancelada'))return cashFail('Ya existe una solicitud para esta persona, ruta y fecha.');
 r={...(old||{}),id:old?.id||crypto.randomUUID(),kind:'ticketRequest',folio:old?.folio||await cashFolio(c.db,'BO'),createdBy:old?.createdBy||c.email,createdById:old?.createdById||c.userId,personId:person.id,personType:person.kind,name:person.name,birthDate,projectId:project?.id||'',projectName:project?.name||'Sin proyecto',division:project?.division||person.division||'',status:'Solicitada'};
 for(const k of ['otherReason','reason','transport','tripType','origin','destination','travelDate','preferredTime','returnDate','returnTime','contact','baggage','notes'])r[k]=String(d[k]||'').trim().slice(0,1500);
 if(r.tripType==='Sencillo'){r.returnDate='';r.returnTime='';}action='Solicitud enviada a Tesorería';
 }else{
 if(!old)return cashFail('Solicitud no encontrada.',404);r={...old};
 if(b.action==='cancel') {if((!rh&&(!requestTickets||old.createdBy!==c.email))||!['Solicitada','Devuelta'].includes(old.status))return cashFail('No es posible cancelar en esta etapa.',403);r.status='Cancelada';action='Solicitud cancelada';}
 else {if(!treasury)return cashFail('Esta acción corresponde a Tesorería.',403);
 if(b.action==='start'&&old.status==='Solicitada'){r.status='En gestión';action='Compra en gestión';}
 else if(b.action==='return'&&['Solicitada','En gestión'].includes(old.status)){if(!String(b.reason||'').trim())return cashFail('Indica qué debe corregirse.');r.status='Devuelta';r.returnReason=String(b.reason).slice(0,1500);action='Devuelta al solicitante para corrección';}
 else if(b.action==='purchase'&&old.status==='En gestión'){
 if(!String(b.reservation||'').trim()||!String(b.carrier||'').trim()||!Number.isFinite(Number(b.amount))||Number(b.amount)<=0)return cashFail('Captura proveedor, localizador o folio e importe MXN.');
 if(!c.rows.some((x:any)=>x.kind==='cashAttachment'&&x.ownerId===old.id&&['application/pdf','image/jpeg','image/png'].includes(x.type)))return cashFail('Adjunta el boleto en PDF o imagen antes de registrar la compra.');
 r.status='Comprada';r.reservation=String(b.reservation).slice(0,150);r.carrier=String(b.carrier).slice(0,150);r.amount=Math.round(Number(b.amount)*100)/100;r.purchasedAt=new Date().toISOString();action='Compra registrada y boleto disponible';
 }else return cashFail('La etapa no permite esta acción.',409);}
 }
 return Response.json({record:await storeCash(c.db,r,old,c.email,action)});
 }catch(e:any){return cashFail(/UNIQUE|constraint/i.test(e.message)?'La solicitud cambió; actualiza antes de continuar.':e.message,409);}
}
