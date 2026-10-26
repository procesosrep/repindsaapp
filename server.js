import http from 'node:http';
import next from 'next';
import {migrate} from './scripts/migrate.mjs';
import {importEncryptedMigration} from './scripts/import-encrypted.mjs';
const dev=process.argv.includes('--dev');process.env.NODE_ENV=dev?'development':'production';
if(!dev&&!process.env.APP_ORIGIN)throw Error('Define APP_ORIGIN con la URL HTTPS pública.');
const port=Number(process.env.PORT||3000);const publicURL=process.env.APP_ORIGIN?new URL(process.env.APP_ORIGIN):new URL('http://localhost:'+port);const app=next({dev,hostname:publicURL.hostname,port:Number(publicURL.port||(publicURL.protocol==='https:'?443:80))});if(process.env.MIGRATION_AUTO_IMPORT!=='0'&&await importEncryptedMigration()){}else {const db=await migrate();const state=await db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name='app_import_state'").first();if(state&&(await db.prepare("SELECT id FROM app_import_state WHERE status!='complete'").first()))throw Error('La importación está pendiente. Ejecuta npm run migration:import antes de iniciar.');}await app.prepare();const handle=app.getRequestHandler();
http.createServer(async(req,res)=>{try{for(const key of Object.keys(req.headers))if(key.startsWith('oai-')||key==='cf-connecting-ip')delete req.headers[key];
// Nunca aceptar identidad del cliente. La aplicación usa sus propias sesiones.
req.headers['cf-connecting-ip']=req.socket.remoteAddress||'unknown';
if(!dev&&process.env.APP_ORIGIN){const origin=new URL(process.env.APP_ORIGIN);req.headers.host=origin.host;req.headers['x-forwarded-host']=origin.host;req.headers['x-forwarded-proto']=origin.protocol.replace(':','');}
if(req.url==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:'ok'}));return;}await handle(req,res);}catch(error){console.error('Error de solicitud:',error.message);if(!res.headersSent){res.writeHead(500,{'Content-Type':'text/plain'});res.end('No fue posible procesar la solicitud.');}}}).listen(port,'0.0.0.0',()=>console.log(`REPINDSA disponible en puerto ${port}`));
