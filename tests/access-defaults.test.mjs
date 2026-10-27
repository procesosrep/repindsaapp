import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpile(readFileSync('app/access-policy.ts','utf8').replace(/export /g,''));
const {accessBaseRoles,defaultAccess,togglePermission,permissionError}=new Function(source+';return {accessBaseRoles,defaultAccess,togglePermission,permissionError}')();
test('Los perfiles predeterminados incluyen los espacios necesarios para sus acciones',()=>{
 const dependencies={requestBox:'box',approveBox:'box',requestMaterials:'materials',requestPurchase:'materials',purchaseTracking:'materials',approveMaterials:'materials',warehouse:'materials',configuration:'panel',editRecords:'panel',payments:'cycle5'};
 for(const role of accessBaseRoles)for(const [action,space] of Object.entries(dependencies)){
  const rights=defaultAccess(role);if(rights[action])assert.equal(rights[space],true,role+': '+action+' requiere '+space);
 }
 assert.equal(defaultAccess('Almacén').box,false);
 assert.equal(defaultAccess('Almacén').requestBox,false);
});

test('Edición de permisos mantiene dependencias sin habilitar acciones adicionales',()=>{
 let rights=togglePermission({},'requestMaterials',true);
 assert.equal(rights.materials,true);assert.equal(rights.requestMaterials,true);assert.equal(rights.approveMaterials,undefined);
 rights=togglePermission(rights,'materials',false);assert.equal(rights.requestMaterials,false);
 assert.match(permissionError({requestBox:true,box:false},'Supervisor'),/Sistema caja/);
 assert.equal(permissionError(defaultAccess('Supervisor'),'Supervisor'),'');
 assert.match(permissionError({...defaultAccess('Supervisor'),configuration:true,panel:true},'Supervisor'),/Administrador/);
});
