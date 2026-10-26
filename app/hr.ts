import {integratedSalary} from './hr-salary';
import {today} from './workflow-utils';
type R=Record<string,any>;
export const documentTypes=[['identity','Identificación oficial'],['curp','CURP'],['tax','Constancia de situación fiscal'],['address','Comprobante de domicilio'],['nss','Número de seguridad social'],['medical','Examen médico de ingreso'],['laboratory','Resultados de laboratorio'],['privacy','Aviso de privacidad y consentimiento']] as const;
export const personFields=[['name','Nombre completo'],['birthDate','Fecha de nacimiento'],['nationality','Nacionalidad'],['sex','Sexo'],['maritalStatus','Estado civil'],['curp','CURP'],['rfc','RFC'],['nss','NSS'],['address','Domicilio completo'],['position','Puesto'],['start','Fecha de ingreso']] as const;
export const employerFields=[['name','Razón social del patrón'],['rfc','RFC del patrón'],['address','Domicilio del patrón'],['nationality','Nacionalidad del patrón'],['representative','Representante legal'],['authority','Documento que acredita sus facultades'],['registration','Registro patronal IMSS']] as const;
export function personDocuments(person:R,rows:R[]){const source=rows.find(r=>r.kind==='candidate'&&r.id===person.candidateId);const merged=new Map<string,R>();for(const d of [...(source?.documents||[]),...(person.documents||[])])merged.set(d.type,d);return Array.from(merged.values());}
export function hrFileBelongs(file:R|undefined,person:R){return !!file&&file.kind==='hrFile'&&(file.personId===person.id||!!person.candidateId&&file.personId===person.candidateId);}
export function dossierStats(person:R,rows:R[],day=today()){
 const docs=personDocuments(person,rows);const missing:string[]=[];let complete=0;
 for(const [key,label] of personFields){if(!String(person[key]||'').trim())missing.push(label);else complete++;}
 if(!Array.isArray(person.beneficiaries)||!person.beneficiaries.length||person.beneficiaries.some((b:R)=>!b.name?.trim()||!b.relationship?.trim()||!Number.isFinite(Number(b.percentage))||Number(b.percentage)<=0)||Math.abs((person.beneficiaries||[]).reduce((a:number,b:R)=>a+Number(b.percentage||0),0)-100)>.001)missing.push('Beneficiarios con distribución de 100%');else complete++;
 for(const [type,label] of documentTypes){const d=docs.find(d=>d.type===type),file=rows.find(f=>f.id===d?.fileId);if(!d||!hrFileBelongs(file,person)||file?.documentType!==type||!d.reviewed||!d.issuedOn||d.issuedOn>day||d.expiresOn&&d.expiresOn<day||d.expiresOn&&d.expiresOn<d.issuedOn)missing.push(label+(d?.expiresOn&&d.expiresOn<day?' (vencido)':''));else complete++;}
 const requirements=rows.filter(r=>r.kind==='requirement'&&r.mandatory&&(r.employeeId===person.id||!!person.candidateId&&r.candidateId===person.candidateId));for(const r of requirements){if(r.status!=='Completado'||r.expiry&&r.expiry<day)missing.push(r.name);else complete++;}
 return {complete:!missing.length,missing,done:complete,total:personFields.length+1+documentTypes.length+requirements.length,documents:docs};
}
export function hrDocumentError(person:R,old:R|undefined,rows:R[],actor:string){
 if(person.kind==='candidate'&&old?.status==='Incorporado'&&JSON.stringify(person.documents||[])!==JSON.stringify(old.documents||[]))return 'Actualiza los documentos desde el expediente de Personal para evitar duplicidades.';
 if(person.documents!==undefined&&!Array.isArray(person.documents))return 'Revisa los documentos del expediente.';
 const seen=new Set();for(const d of person.documents||[]){const file=rows.find(f=>f.id===d.fileId);if(!hrFileBelongs(file,person)||file?.documentType!==d.type||!documentTypes.some(([t])=>t===d.type)||seen.has(d.type))return 'El documento no corresponde a esta persona o está duplicado.';seen.add(d.type);if(!d.issuedOn||d.issuedOn>today()||d.expiresOn&&d.expiresOn<d.issuedOn)return 'Revisa la fecha de emisión y vigencia del documento.';const before=(old?.documents||[]).find((x:R)=>x.type===d.type);d.reviewedBy=d.reviewed?(before?.fileId===d.fileId&&before?.reviewed?before.reviewedBy:actor):undefined;d.reviewedAt=d.reviewed?(before?.fileId===d.fileId&&before?.reviewed?before.reviewedAt:new Date().toISOString()):undefined;}
 return '';
}
export function employeeError(r:R,old:R|undefined,rows:R[]){
 for(const key of ['curp','rfc'])if(r[key])r[key]=String(r[key]).trim().toUpperCase();
 if(r.curp&&!/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(r.curp))return 'Revisa la CURP (18 caracteres).';
 if(r.rfc&&!/^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/.test(r.rfc))return 'Revisa el RFC del trabajador (13 caracteres).';
 if(r.nss&&!/^\d{11}$/.test(r.nss))return 'Revisa el NSS (11 dígitos).';
 if(rows.some(e=>e.kind==='employee'&&e.id!==r.id&&(r.curp&&e.curp===r.curp||r.rfc&&e.rfc===r.rfc)))return 'Esta persona ya tiene expediente. Abre el registro existente.';
 if(!old&&r.candidateId)return 'La incorporación desde Reclutamiento crea automáticamente el expediente.';
 if(old&&r.projectId!==old.projectId&&rows.some(c=>c.employeeId===r.id&&contractInProgress(c)))return 'Conserva la asignación mientras exista un contrato en seguimiento.';
 if(old&&r.candidateId!==old.candidateId)return 'Se conserva el candidato de origen.';
 if(r.candidateId&&rows.some(e=>e.kind==='employee'&&e.id!==r.id&&e.candidateId===r.candidateId))return 'Este candidato ya tiene expediente.';
 if(r.birthDate&&(r.birthDate>today()||r.birthDate>String(Number(today().slice(0,4))-18)+today().slice(4)))return 'Para menores de edad se requiere un contrato y control especial; revisa la fecha de nacimiento.';
 for(const k of ['salary','complementSalary','bonuses'])if(r[k]!==undefined&&r[k]!==''&&(!Number.isFinite(Number(r[k]))||Number(r[k])<0))return 'Revisa salario, complemento y bonos.';
 if(r.status==='Inactivo'){
 if(!r.departure||r.departure>today()||r.start&&r.departure<r.start||!r.departureReason?.trim())return 'Registra fecha de baja válida y motivo.';
 if(old?.status==='Inactivo'&&['departure','departureReason','start','candidateId'].some(k=>JSON.stringify(r[k])!==JSON.stringify(old[k])))return 'La baja registrada se conserva en el historial.';
 }
 if(r.status==='Activo'&&old?.status!=='Activo'&&(!r.start||r.start>today()||!dossierStats(r,rows).complete||!rows.some(c=>c.kind==='laborContract'&&c.employeeId===r.id&&c.status==='Firmado'&&!c.terminatedAt&&(!c.end||c.end>=today()))))return 'Completa el expediente y registra un contrato firmado antes de activar al trabajador.';
 if(r.departure&&r.status!=='Inactivo'&&!(old?.status==='Inactivo'&&r.status==='En incorporación'))return 'Para dar de baja usa la acción Registrar baja.';
 if(old?.status==='Inactivo'&&r.status==='En incorporación'){r.employmentCycle=Number(old.employmentCycle||1)+1;r.reentries=[...(old.reentries||[]),{start:old.start,departure:old.departure,reason:old.departureReason}];if(!r.start||r.start<=old.departure||r.start>today())return 'Indica la fecha real de reingreso, posterior a la baja.';delete r.departure;delete r.departureReason;delete r.exitChecklist;}
 r.fileStatus=dossierStats(r,rows).complete?'Completo':'Incompleto';return '';
}
export function contractInProgress(c:R,day=today()){return c.kind==='laborContract'&&!c.terminatedAt&&!['Cancelado','No firmado'].includes(c.status)&&!(c.status==='Firmado'&&c.end&&c.end<day);}
export function contractValidity(c:R,day=today()){return c.terminatedAt?'Terminado por baja':c.status==='Cancelado'?'Cancelado':c.end&&c.end<day?'Vencido':c.end&&c.end<=new Date(Date.parse(day+'T12:00:00Z')+30*86400000).toISOString().slice(0,10)?'Por vencer':c.start>day?'Inicio próximo':'Vigente';}
export function contractError(r:R,old:R|undefined,rows:R[],actor:string){
 const employee=rows.find(e=>e.kind==='employee'&&e.id===r.employeeId);if(!employee)return 'Selecciona un trabajador.';
 if(old){
 if(old.terminatedAt&&r.status!==old.status)return 'El contrato conserva su estado después de registrar la baja.';
 if(r.status!==old.status&&['En firma','Firmado'].includes(r.status)&&rows.some(c=>c.id!==r.id&&c.employeeId===r.employeeId&&contractInProgress(c)))return 'Ya existe otro contrato en seguimiento para esta persona.';
 const immutable=['employeeId','employerId','snapshot','start','end','modality','justification','employmentCycle','documentHtml','previousContractId'];if(immutable.some(k=>JSON.stringify(r[k])!==JSON.stringify(old[k])))return 'Los datos de un contrato elaborado se conservan. Cancela el no firmado y genera uno nuevo.';
 r.terminatedAt=old.terminatedAt;r.terminationReason=old.terminationReason;
 if(old.status==='Firmado'&&['signedFileId','signedDate'].some(k=>r[k]!==old[k]))return 'La evidencia de un contrato firmado se conserva.';
 if(r.status==='No firmado'&&!r.notSignedReason?.trim())return 'Agrega el motivo por el que no se firmó.';
 if(r.status==='Cancelado'&&!r.cancelReason?.trim())return 'Agrega el motivo de cancelación.';
 if(r.status==='Firmado'){
 if(employee.status==='Inactivo'||old.terminatedAt)return 'El trabajador está de baja.';
 const f=rows.find(f=>f.id===r.signedFileId);if(!hrFileBelongs(f,employee)||f?.documentType!=='signedContract'||f?.contractId!==r.id||!r.signedDate||r.signedDate>today())return 'Adjunta el PDF firmado de este contrato y su fecha de firma.';
 }else if(old.status!=='Firmado'){delete r.signedFileId;delete r.signedDate;}
 return '';
 }
 if(employee.status==='Inactivo')return 'Registra primero el reingreso del trabajador.';
 const dossier=dossierStats(employee,rows);if(!dossier.complete)return 'Completa el expediente: '+dossier.missing.join(', ');
 const employer=rows.find(e=>e.kind==='employer'&&e.id===r.employerId);if(!employer||employerFields.some(([k])=>!String(employer[k]||'').trim()))return 'El administrador debe completar los datos legales del patrón.';
 if(r.employeeRevision!==employee.revision||r.employerRevision!==employer.revision)return 'El expediente o el patrón cambió. Cierra y vuelve a abrir la elaboración del contrato.';
 if(rows.some(c=>c.employeeId===r.employeeId&&Number(c.employmentCycle||1)===Number(employee.employmentCycle||1)&&contractInProgress(c)))return 'El trabajador ya tiene contrato en seguimiento. Abre el contrato existente.';
 const terms=r.conditions||{};for(const k of ['complementSalary','bonuses'])if(terms[k]!==undefined&&(!Number.isFinite(Number(terms[k]))||Number(terms[k])<0))return 'Revisa complemento salarial y bonos.';
 for(const key of ['duties','workplace','schedule','restDays','payDay','payPlace','signPlace','start','salaryPeriod','paymentFrequency','workType','shift'])if(!String(terms[key]||'').trim())return 'Completa las condiciones laborales y lugar de firma.';
 if(!['Indeterminado','Obra determinada','Tiempo determinado'].includes(r.modality))return 'Selecciona la modalidad de contratación.';
 if(r.modality!=='Indeterminado'&&!r.justification?.trim())return 'Justifica la naturaleza de la obra o la causa legal del plazo determinado.';
 if(r.modality==='Tiempo determinado'&&(!terms.end||terms.end<terms.start))return 'Indica un fin posterior al inicio del contrato.';
 if(r.modality==='Obra determinada'&&(!terms.projectId||!terms.workScope?.trim()))return 'Selecciona el proyecto y delimita la obra contratada.';
 if(terms.projectId&&!rows.some(p=>p.id===terms.projectId&&p.kind==='project'&&p.status!=='Cerrado'&&p.id===employee.projectId))return 'Selecciona el proyecto activo asignado al trabajador.';
 if(terms.start!==employee.start){const prior=rows.find(p=>p.id===r.previousContractId&&p.kind==='laborContract'&&p.employeeId===employee.id&&p.status==='Firmado'&&p.end&&p.end<terms.start&&!p.terminatedAt);if(!prior||terms.start<employee.start)return 'La fecha se toma del ingreso; un nuevo periodo requiere un contrato anterior vencido.';}
 // CONASAMI 2026: https://sidof.segob.gob.mx/notas/docFuente/5775534
 const floor=Number(today().slice(0,4))===2026?(terms.wageZone==='Zona Libre de la Frontera Norte'?440.87:315.04):0;
 if(Number(terms.minimumDailyWage)<floor)return 'El mínimo aplicable no puede ser inferior al mínimo general vigente para la zona.';
 const days=({Diario:1,Semanal:7,Quincenal:15,Mensual:30} as R)[terms.salaryPeriod];if(!days||!Number.isFinite(Number(terms.salary))||Number(terms.salary)<=0)return 'Registra el salario bruto y su periodo.';
 if(!['Material','Administrativo / técnico'].includes(terms.workType)||!['Semanal','Quincenal'].includes(terms.paymentFrequency)||terms.workType==='Material'&&terms.paymentFrequency!=='Semanal')return 'El pago del trabajo material es semanal; los demás puestos, semanal o quincenal.';
 if(!Number.isFinite(Number(terms.minimumDailyWage))||Number(terms.minimumDailyWage)<=0||Number(terms.salary)/days<Number(terms.minimumDailyWage))return 'Verifica el salario mínimo aplicable a la zona y al puesto; el sueldo no puede ser inferior.';
 const year=Number(terms.start.slice(0,4)),limit=year>=2030?40:year===2029?42:year===2028?44:year===2027?46:48;const daily=({Diurno:8,Nocturno:7,Mixto:7.5} as R)[terms.shift];if(![terms.dailyHours,terms.weeklyHours].every(n=>Number.isFinite(Number(n))))return 'Revisa las horas de jornada.';
 if(!daily||Number(terms.dailyHours)<=0||Number(terms.dailyHours)>daily||Number(terms.weeklyHours)<=0||Number(terms.weeklyHours)>limit||Number(terms.weeklyHours)>Number(terms.dailyHours)*6)return 'Revisa la jornada diaria y semanal conforme al turno y año de inicio.';
 if(Number(terms.vacationDays)<12||Number(terms.vacationPremium)<25||Number(terms.bonusDays)<15||![terms.vacationDays,terms.vacationPremium,terms.bonusDays].every(n=>Number.isFinite(Number(n))))return 'Las prestaciones no pueden ser inferiores a los mínimos legales.';
 if(!integratedSalary(terms))return 'Revisa los importes fijos y las prestaciones para calcular el SDI.';
 if(!terms.reviewConfirmed)return 'Revisa y confirma las condiciones antes de elaborar el contrato.';
 delete r.terminatedAt;delete r.terminationReason;
 r.name='Contrato laboral · '+employee.name;r.division=employee.division;r.projectId=employee.projectId;r.start=terms.start;r.end=r.modality==='Tiempo determinado'?terms.end:'';r.employmentCycle=Number(employee.employmentCycle||1);
 const worker=Object.fromEntries([...personFields.map(([k])=>k),'phone','email','beneficiaries'].map(k=>[k,employee[k]]));
 r.snapshot={worker,employer:Object.fromEntries(employerFields.map(([k])=>[k,employer[k]])),conditions:{...terms,salaryIntegration:integratedSalary(terms)},modality:r.modality,justification:r.justification||'',templateVersion:'MX-LFT-2026.1',reviewedBy:actor,reviewedAt:new Date().toISOString()};delete r.conditions;delete r.signedFileId;delete r.signedDate;r.status='Elaborado';return '';
}
