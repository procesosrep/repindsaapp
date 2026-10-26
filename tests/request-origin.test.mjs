import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreviewOrigin} from '../server/request-origin.mjs';
const canonical='https://repindsa.example';

test('Vista previa: origen del mismo sitio confirmado por el navegador tras un proxy',()=>{
 const headers={origin:'https://app.preview.example','sec-fetch-site':'same-origin'};
 assert.equal(normalizePreviewOrigin(headers,canonical),true);
 assert.equal(headers.origin,canonical);
});

test('Origen: rechaza externos, subdominios same-site y cabeceras de proxy manipuladas',()=>{
 for(const site of ['cross-site','same-site','none',undefined]){
  const headers={origin:'https://external.example','sec-fetch-site':site,'x-forwarded-host':'repindsa.example'};
  assert.equal(normalizePreviewOrigin(headers,canonical),false);
  assert.equal(headers.origin,'https://external.example');
 }
 for(const origin of ['null','http://preview.example','https://user:pass@preview.example','https://preview.example/path','https://preview.example/', 'https://preview.example?x=1','https://preview.example,https://repindsa.example']){
  const headers={origin,'sec-fetch-site':'same-origin'};
  assert.equal(normalizePreviewOrigin(headers,canonical),false);
  assert.equal(headers.origin,origin);
 }
});

test('Origen: conserva clientes del origen configurado y permite HTTP sólo en desarrollo',()=>{
 assert.equal(normalizePreviewOrigin({origin:canonical},canonical),false);
 const local={origin:'http://localhost:3000','sec-fetch-site':'same-origin'};
 assert.equal(normalizePreviewOrigin(local,canonical,{dev:true}),true);
 assert.equal(normalizePreviewOrigin({},canonical),false);
});
