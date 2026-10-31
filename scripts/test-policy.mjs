import {nextFolio} from '../server/folios.mjs';
import {folioSpec} from '../server/folio-policy.mjs';
Object.assign(globalThis,{nextFolio,folioSpec});
import fs from 'node:fs';import ts from 'typescript';
const text=ts.transpile(fs.readFileSync('app/access-policy.ts','utf8').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});
export const policy=new Function(text+';return {isDirector,normalizedAccessProfile,accessBaseRoles,accessPermissionGroups,accessPermissionKeys,defaultAccess,togglePermission,permissionError,accessRights,hasAccess,checkedRights,accessSystems,isOwnRecord,canReviewBox,canReviewMaterial,requestApprover,accessKind}')();Object.assign(globalThis,policy);
globalThis.provisionUsers=async()=>{};

const featureText=ts.transpile(fs.readFileSync('app/feature-policy.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(featureText+';return {featureGroups,featureOpen,featureAllowed,featureProfile,workspaceVisible}')());globalThis.readFeatures=async()=>({revision:0,public:{workspaceCaja:true,workspacePanel:true}});globalThis.featureGuard=async()=>null;

const receiptText=ts.transpile(fs.readFileSync('app/material-receipt.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(receiptText+';return {receiptToday,receiptDeadline,receiptResponsible,receiptIsOwner,pendingReceipts,receiptOverdue,receiptTasks,receiptState,receiptConfirmed,recordMaterialDelivery,respondReceipt,resolveReceipt,receiptSubmissionError,receiptDemoRecord}')());

globalThis.purchaseAccessUpgrade=async()=>{};
const notificationText=ts.transpile(fs.readFileSync('app/notification-policy.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(notificationText+';return {suppressRequestNotifications,notificationIdentity,requestNotificationParticipation}')());

const warehouseSeed=JSON.parse(fs.readFileSync('app/warehouse-catalog-seed.json','utf8'));const warehouseText=ts.transpile(fs.readFileSync('app/warehouse-catalog.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function('warehouseSeed',warehouseText+';return {warehouseCatalog,selectedCatalogLines,saveWarehouseArticle}')(warehouseSeed));
const salaryText=ts.transpile(fs.readFileSync('app/hr-salary.ts','utf8').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(salaryText+';return {integratedSalary}')());

const projectSeed=JSON.parse(fs.readFileSync('app/active-project-seed.json','utf8'));const projectViewText=ts.transpile(fs.readFileSync('app/active-projects-view.ts','utf8').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(projectViewText+';return {projectRP,isActiveProject,activeProjectOptions,resolveRequestProject}')());globalThis.ensureActiveProjects=async()=>{};
globalThis.ensureAudit=async()=>{};
globalThis.provisionPurchaseManager=async()=>{};
const cycleModel=ts.transpile(fs.readFileSync('app/material-model.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(cycleModel+';return {materialStatus}')());
const cycleCode=ts.transpile(fs.readFileSync('app/purchase-cycle.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(cycleCode+';return {purchaseReceiptReady,receivePurchase,dispatchPurchaseToSite,purchaseCycleStatus}')());
const trackingCode=ts.transpile(fs.readFileSync('app/purchase-tracking.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(trackingCode+';return {updatePurchaseTracking}')());
globalThis.validCashDate=new Function(ts.transpile(fs.readFileSync('app/cash-model.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022})+';return validCashDate')();globalThis.materialToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'});

const richTextCode=ts.transpile(fs.readFileSync('app/rich-text.ts','utf8').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(richTextCode+';return {cleanRichText,richTextLimit}')());

const documentPolicyText=ts.transpile(fs.readFileSync('app/document-policy.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(documentPolicyText+';return {canAuthorDocument,documentParticipant,officialDocument,documentPending}')());

const viaticosText=ts.transpile(fs.readFileSync('app/viaticos-policy.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});Object.assign(globalThis,new Function(viaticosText+';return {recoveredViaticosRouting,viaticosVisible,viaticosCanDecide,invoiceKeys,viaticosTaxLabel,expenseDeclaration}')());
