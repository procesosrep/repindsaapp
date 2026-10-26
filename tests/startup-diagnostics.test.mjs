import test from 'node:test';
import assert from 'node:assert/strict';
import {startupDiagnostics} from '../server/startup-diagnostics.mjs';

test('Diagnóstico MySQL orienta sin imprimir credenciales ni mensajes del driver',()=>{
 for(const code of ['ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR','ENOTFOUND','ECONNREFUSED','ER_BINLOG_CREATE_ROUTINE_NEED_SUPER']) {
  const lines=startupDiagnostics({code,message:'secret-password',sql:'sensitive-query'},'base de datos').join('\n');
  assert.match(lines,new RegExp(code));assert.doesNotMatch(lines,/secret-password|sensitive-query/);
 }
 assert.match(startupDiagnostics({message:'Define APP_ORIGIN con la URL HTTPS pública.'},'configuración').join('\n'),/APP_ORIGIN/);
 assert.doesNotMatch(startupDiagnostics({code:'bad secret',message:'secret-password'},'base de datos').join('\n'),/bad secret|secret-password/);
});
