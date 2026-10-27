import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpile(readFileSync('app/material-model.ts','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''));
const {materialRequestError}=new Function(source+';return {materialRequestError}')();
test('Envío de materiales exige partidas, cantidades positivas y unidades',()=>{
 const base={requester:'Solicitante',serviceReference:'RP-680-26',lines:[{description:'Artículo',quantity:2,unit:'Pieza'}]};
 assert.equal(materialRequestError(base),'');
 for(const lines of [undefined,[],null])assert.match(materialRequestError({...base,lines}),/al menos una partida/);
 for(const quantity of ['',null,undefined,0,-1,Infinity,'abc',true])assert.match(materialRequestError({...base,lines:[{quantity,unit:'Pieza'}]}),/cantidad/);
 assert.match(materialRequestError({...base,lines:[{quantity:1,unit:''}]}),/unidad/);
 assert.match(materialRequestError({...base,neededBy:'2026-02-30'}),/fecha/);
});
