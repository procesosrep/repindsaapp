import './test-policy.mjs';import assert from 'node:assert/strict';import fs from 'node:fs';
const routing={materialApprover:'manager-one',boxApprover:'manager-one',fallbackApprover:'admin-one',warehouseOperator:'warehouse-one',treasuryOperator:'treasury-one'};
const context=(username,role,rights={})=>({username,userId:'local:'+username,email:'usuario:'+username,actualRole:role,profile:{role,rights:{...defaultAccess(role),...rights}},routing,rows:[]});
const material={kind:'materialRequest',createdBy:'usuario:supervisor-one',requesterId:'local:supervisor-one',assignedApprover:'manager-one',managerApprovedAt:'2026-10-23T10:00:00Z',history:[]};
const participates=(r,c)=>Object.values(requestNotificationParticipation(r,c)).some(Boolean);
assert(participates(material,context('supervisor-one','Supervisor')));assert(!participates(material,context('supervisor-two','Supervisor')));
assert(participates(material,context('manager-one','Gerente')));assert(!participates(material,context('manager-two','Gerente')));
assert(participates(material,context('warehouse-one','Gerente',{warehouse:true})));assert(!participates(material,context('warehouse-two','Gerente',{warehouse:true})));
for(const role of ['Administrador','Dirección']){const c=context('supervisor-one',role);assert(suppressRequestNotifications(c));assert(!participates(material,c));assert(hasAccess(c.profile,'approveMaterials'));}
const cash={kind:'cashAdvance',createdById:'local:supervisor-one',assignedApprover:'manager-one',authorizationRole:'Gerente',history:[]};assert(participates(cash,context('treasury-one','Tesorería')));assert(!participates(cash,context('treasury-two','Tesorería')));assert(!participates(cash,context('unrelated','Visor',{viewAll:true})));
const ticket={kind:'ticketRequest',createdBy:'usuario:rh-one',history:[]};assert(participates(ticket,context('rh-one','Recursos Humanos')));assert(!participates(ticket,context('rh-two','Recursos Humanos')));assert(participates(ticket,context('treasury-one','Tesorería')));assert(!participates(ticket,context('manager-one','Gerente')));
const purchase={kind:'materialPurchase',standalone:true,createdBy:'usuario:warehouse-one',history:[]};assert(participates(purchase,context('warehouse-one','Gerente',{warehouse:true})));assert(!participates(purchase,context('warehouse-two','Gerente',{warehouse:true})));
const actual={...material,history:[{actor:'usuario:warehouse-two',action:'Surtido parcial registrado'}]};assert(participates(actual,context('warehouse-two','Gerente',{warehouse:true})));assert(!participates(actual,context('other','Gerente',{warehouse:true})));
assert(!notificationIdentity('',context('','Supervisor')));assert(!notificationIdentity('usuario:supervisor-on',context('supervisor-one','Supervisor')));
const page=fs.readFileSync('app/page.tsx','utf8');assert(page.includes("const menus=[['Dashboard',LayoutDashboard"));assert(!page.includes('Control y reportes'));assert(page.includes("[module,setModule]=useState('Dashboard')"));
console.log('Participants-only notifications passed for requester, assigned approver, assigned/actual handler, Materials, Caja, tickets and purchases; admin/director exclusion and Dashboard-first menu passed.');
