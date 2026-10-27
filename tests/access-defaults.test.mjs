import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpile(readFileSync('app/access-policy.ts','utf8').replace(/export /g,''));
const {accessBaseRoles,defaultAccess}=new Function(source+';return {accessBaseRoles,defaultAccess}')();
test('Los perfiles predeterminados incluyen los espacios necesarios para sus acciones',()=>{
 const dependencies={requestBox:'box',approveBox:'box',requestMaterials:'materials',requestPurchase:'materials',purchaseTracking:'materials',approveMaterials:'materials',warehouse:'materials',configuration:'panel',editRecords:'panel',payments:'cycle5'};
 for(const role of accessBaseRoles)for(const [action,space] of Object.entries(dependencies)){
  const rights=defaultAccess(role);if(rights[action])assert.equal(rights[space],true,role+': '+action+' requiere '+space);
 }
 assert.equal(defaultAccess('Almacén').box,false);
 assert.equal(defaultAccess('Almacén').requestBox,false);
});
