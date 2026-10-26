# REPINDSA · Node.js / GitHub / GoDaddy

Versión 1.2.0 · Código actualizado al 26 de octubre de 2026.

Sube **todo el contenido descomprimido de este ZIP** a un repositorio privado. `package.json` debe quedar en la raíz. No necesitas añadir, quitar ni editar archivos del paquete. Después conecta ese repositorio con GoDaddy Node.js Hosting.

## Configuración del alojamiento

| Campo | Valor |
|---|---|
| Node.js | 22 LTS actualizado o 24 LTS |
| Instalación | `npm ci` |
| Compilación | `npm run build` |
| Inicio | `npm start` |
| Entrada | `server.js` |
| Puerto | El `PORT` asignado automáticamente por GoDaddy |
| Comprobación de salud | `/healthz` |

Las dependencias de compilación y ejecución están declaradas en `dependencies`, para los despliegues que no instalan `devDependencies`.

## Variables del servidor

Configúralas desde el panel de GoDaddy, sin modificar los archivos. El TXT privado entregado por separado contiene la clave de restauración y los pasos completos. **Ese TXT no forma parte del ZIP ni debe subirse a GitHub.**

- `APP_ORIGIN`: URL pública HTTPS exacta.
- `DATABASE_URL`: base **libSQL/Turso remota, nueva y vacía**.
- `DATABASE_AUTH_TOKEN`: token de esa base, cuando lo requiera el proveedor.
- `S3_BUCKET`: bucket privado para adjuntos.
- `S3_REGION`: región del proveedor; `auto` para Cloudflare R2.
- `S3_ENDPOINT`: endpoint compatible con S3; vacío para Amazon S3.
- `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`: acceso limitado al bucket.
- `MIGRATION_IMPORT_KEY`: clave privada del TXT. Necesaria sólo para restaurar por primera vez.

Estos valores son privados del servidor. No uses prefijos `NEXT_PUBLIC_` para ellos.

## Base de datos incluida

`migration/repindsa-backup.enc` contiene el respaldo real cifrado con AES-256-GCM: solicitudes de materiales, compras, registros relacionados, usuarios, hashes de contraseñas, permisos, folios, catálogos, bitácoras y adjuntos.

`migration/backup-info.json` indica la fecha exacta del corte y los conteos. No se transfieren las sesiones abiertas ni los contadores temporales de intentos. Los usuarios ingresan nuevamente con sus contraseñas actuales.

El primer inicio restaura y verifica automáticamente cada fila y cada adjunto en los servicios configurados. No ejecutes `admin:create` durante esta migración. Tras finalizar, los reinicios reconocen la restauración y **conservan las operaciones nuevas sin volver a importar ni sobrescribirlas**. La clave puede retirarse del panel de GoDaddy tras verificar la instalación.

Si la base de destino ya contiene información, el importador la rechaza: no sobrescribe datos existentes. Si la restauración se interrumpe, se reanuda con el mismo respaldo y verifica su contenido antes de iniciar la aplicación.

El respaldo es un corte, no sincronización en tiempo real. Para un cambio definitivo de alojamiento, evita capturas simultáneas en ambos sistemas y realiza una sincronización final de lo registrado después del corte.

## Requisitos adicionales evaluados

Se necesita un plan que ejecute Node.js, base libSQL/Turso, almacenamiento privado S3/R2, salida de red hacia ambos servicios y HTTPS. Un alojamiento estático, WordPress o sólo PHP no puede ejecutar este sistema. No se utiliza el almacenamiento temporal del despliegue para conservar información empresarial.

Se sustituyeron las dependencias del entorno Cloudflare Workers por un adaptador Node.js para base de datos y archivos. La identidad se valida mediante las sesiones de la aplicación; el servidor elimina las cabeceras de identidad externas recibidas del cliente.

Incluye el módulo de incidentes laborales, las mejoras de solicitudes, cuatro grupos de estado y «Agregar más» para artículos fuera de catálogo. Los módulos existentes y sus flujos se mantienen.

## Verificación

```bash
npm ci
npm test
npm run typecheck
npm run test:flows
npm run build
```

En GoDaddy basta configurar las variables y desplegar. La validación de GitHub Actions no requiere la clave del respaldo. Para verificar el registro de restauración en un entorno ya configurado: `npm run migration:verify`.

El paquete se probó con restauración real sobre una base vacía, comparación exacta de tablas y adjuntos, arranque de producción y acceso autenticado a las API de registros, materiales, compras, bitácora e incidentes. Las credenciales y conectividad de los servicios que contrates se verifican al configurar tu alojamiento.

## Referencias oficiales

- [Requisitos de aplicaciones Node.js en GoDaddy](https://developer.godaddy.com/en/docs/api-users/hosting/app-requirements)
- [Servidor personalizado de Next.js](https://nextjs.org/docs/pages/guides/custom-server)
