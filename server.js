import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {serverConfig} from './server/config.mjs';
import next from 'next';
import {initializeFreshDatabase, bootstrapAdministrator} from './server/fresh-install.mjs';
import {migrate} from './scripts/migrate.mjs';
import {importEncryptedMigration} from './scripts/import-encrypted.mjs';

// Hosting panels may launch this entry point from a different working directory.
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
const dev = process.argv.includes('--dev');
process.env.NODE_ENV = dev ? 'development' : 'production';
let stage = 'configuración';
let app;
try {
  console.log('[REPINDSA] Inicio del servidor.');
  const {port, origin} = serverConfig(process.env, dev);
  stage = 'migraciones y conexión a la base de datos';
  console.log('[REPINDSA] Comprobando base de datos y migraciones.');
  // Fresh installations are the default; restoration requires explicit opt-in.
  const autoImport = process.env.MIGRATION_AUTO_IMPORT === '1';
  if (autoImport) {
    stage = 'restauración del respaldo';
    console.log('[REPINDSA] Comprobando restauración del respaldo.');
  }
  if (!(autoImport && await importEncryptedMigration())) {
    const db = await migrate();
    const state = await db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name='app_import_state'").first();
    if (state && await db.prepare("SELECT id FROM app_import_state WHERE status!='complete'").first()) {
      throw Error('La importación está pendiente. Ejecuta npm run migration:import antes de iniciar.');
    }
    if (await initializeFreshDatabase(db)) console.log('[REPINDSA] Base nueva inicializada sin datos históricos ni ejemplos.');
    if (await bootstrapAdministrator(db)) console.log('[REPINDSA] Primer administrador creado; debe cambiar su contraseña al ingresar.');
  }
  stage = 'preparación de Next.js';
  console.log('[REPINDSA] Preparando Next.js.');
  app = next({dev, dir:process.cwd(), hostname:origin.hostname, port});
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = http.createServer(async (req, res) => {
    try {
      for (const key of Object.keys(req.headers)) {
        if (key.startsWith('oai-') || key === 'cf-connecting-ip') delete req.headers[key];
      }
      // Identity is derived from application sessions, never external headers.
      req.headers['cf-connecting-ip'] = req.socket.remoteAddress || 'unknown';
      if (!dev) {
        req.headers.host = origin.host;
        req.headers['x-forwarded-host'] = origin.host;
        req.headers['x-forwarded-proto'] = origin.protocol.replace(':', '');
      }
      if (req.url === '/healthz') {
        res.writeHead(200, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
        res.end(JSON.stringify({status:'ok'}));
        return;
      }
      await handle(req, res);
    } catch {
      console.error('[REPINDSA] Error al procesar una solicitud.');
      if (!res.headersSent) res.writeHead(500, {'Content-Type':'text/plain'});
      if (!res.writableEnded) res.end('No fue posible procesar la solicitud.');
    }
  });
  stage = 'apertura del puerto';
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', resolve);
  });
  console.log(`[REPINDSA] Listo en puerto ${port}. Salud: /healthz`);
} catch (error) {
  // Driver messages can contain URLs/credentials: expose only safe local causes.
  console.error(`[REPINDSA] Falló el inicio en la etapa: ${stage}.`);
  if (stage === 'configuración' || String(error.message).startsWith('Configura ') ||
      String(error.message).startsWith('La importación está pendiente.')) {
    console.error(error.message);
  } else {
    const code = String(error.code || 'STARTUP_ERROR');
    console.error(`[REPINDSA] Código: ${/^[A-Z0-9_]+$/.test(code) ? code : 'STARTUP_ERROR'}. Revisa la configuración de esta etapa en README.md.`);
  }
  if (app) await app.close().catch(() => {});
  process.exit(1);
}
