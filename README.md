# REPINDSA · GoDaddy Node.js y MySQL

La instalación nueva utiliza **la base MySQL alojada por GoDaddy** y guarda allí
los registros, las sesiones y los adjuntos privados. No requiere cuentas de Turso,
S3 ni otro proveedor. El código conserva el adaptador SQLite/libSQL para desarrollo
local y pruebas, pero selecciona MySQL automáticamente cuando existe `DB_HOST`.

## Primera etapa: solicitudes de materiales

La prioridad de salida es Materiales. Se pueden configurar el autorizador,
alterno y Almacén sin completar rutas de Caja o Tesorería. El alterno de
Materiales puede tener sólo autorización de materiales. Cada solicitud debe
contener partidas válidas y ser autorizada por otra persona, incluso cuando
quien la creó es administrador. Consulta la arquitectura, correcciones y lista
de verificación de publicación en [Revisión y primera etapa](docs/revision-materiales.md).

## Configuración en GoDaddy

| Campo | Valor |
|---|---|
| Node.js | 24 LTS o 22 LTS actualizado, mínimo 22.13 |
| Instalación | `npm ci` |
| Compilación | `npm run build` |
| Inicio | `npm start` |
| Entrada | `server.js` |
| Puerto | `PORT` asignado por GoDaddy, escucha en `0.0.0.0` |
| Salud | `/healthz` |

Conecta `procesosrep/repindsaapp`, rama `main`, con `package.json` en la raíz.
Necesitas un plan que ejecute Node.js para publicar. La pestaña **Base de datos
alojada → Abrir la guía de la base de datos** indica cómo conectar su MySQL.

En **Configuración → Secretos → Vista previa** conserva los valores MySQL
proporcionados por GoDaddy; no copies los asteriscos del panel:

- `DB_HOST`, `DB_PORT` (normalmente 3306), `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- `APP_ORIGIN`: URL HTTPS completa del entorno, sin rutas ni parámetros.
- `ADMIN_USERNAME`: nombre del primer administrador, 3 a 50 caracteres
  (letras minúsculas, números, punto, guion o guion bajo).
- `ADMIN_NAME`: nombre visible.
- `ADMIN_PASSWORD`: contraseña privada inicial de 12 a 128 caracteres.
- `MIGRATION_AUTO_IMPORT=0`: instalación nueva, también predeterminado.

Si la guía exige TLS, agrega `DB_SSL=true` y, cuando corresponda, `DB_SSL_CA`
con el certificado CA del proveedor. La verificación de certificados permanece
activa. No se habilita TLS ni se selecciona una CA por adivinación.

`DB_USERNAME` y `DB_DATABASE` se admiten como alias, pero la guía mostrada utiliza
`DB_USER` y `DB_NAME`. No configures `DATABASE_URL`, `DATABASE_AUTH_TOKEN`,
`MIGRATION_IMPORT_KEY` ni `S3_*` para este modo.

Guarda los secretos y actualiza la vista previa. El arranque aplica el esquema,
prepara las tablas de adjuntos y crea el primer administrador si la base aún no
tiene usuarios ni propietario. No se restaura el respaldo cifrado ni los registros comerciales de demostración.
Por solicitud del usuario, se recuperan los 27 proyectos incluidos del CRM y sus
clientes al abrir los espacios de trabajo. Los 4,338 artículos de Almacén se
cargan al consultar el catálogo para una solicitud de materiales. Esta recuperación
es aditiva y se ejecuta una vez, incluso en la instalación inicialmente vacía;
conserva los proyectos existentes por RP y sus datos operativos, usuarios y permisos. No se borra una base
existente. Algunos catálogos de trabajo se inicializan al usar sus módulos.

Al ingresar debes cambiar la contraseña. Después retira `ADMIN_PASSWORD` del
panel; los reinicios nunca restablecen una contraseña ni crean otro administrador
si ya existen usuarios o propietario. También está disponible `npm run admin:create`
para instalaciones con terminal privada.

## Publicación, almacenamiento y permisos

La pantalla de GoDaddy indica que **Vista previa y Publicar comparten MySQL**:
no son bases aisladas. Las pruebas que hagas en la vista previa pueden modificar
los datos publicados. Configura los secretos de cada entorno y usa su propio
`APP_ORIGIN`; conserva la misma identidad de administrador. No reinicialices la
base al publicar. Publica desde el panel cuando la vista previa esté verificada.

Los adjuntos se guardan en las tablas `app_files` y `app_file_chunks`, divididos
en bloques de 256 KiB y confirmados en una transacción InnoDB. No dependen del
disco temporal del proceso. Siguen pasando por los permisos de las API privadas;
no se generan URLs públicas del almacenamiento. Los adjuntos consumen la cuota
y el respaldo de MySQL: comprueba los límites del plan y conserva copias de seguridad.

La cuenta MySQL debe poder crear tablas e índices, además de leer y escribir datos.
No se requieren `SUPER`, `CREATE ROUTINE`, ni `TRIGGER`: la bitácora se escribe
mediante el adaptador de la aplicación, en la **misma transacción** que cambia el
registro. Si el lote falla, también se revierte la auditoría. El adaptador rechaza
editar o borrar la bitácora. Los triggers de una instalación anterior, si existen,
se conservan y se detectan para evitar duplicar eventos.

En el modo de auditoría de aplicación, las escrituras directas realizadas desde
un cliente MySQL externo no pasan por el adaptador y no se registran automáticamente;
quien tenga esas credenciales puede modificar las tablas directamente. Usa las API
de la aplicación para las operaciones normales y limita el acceso directo a la base.

## Origen de la vista previa

`APP_ORIGIN` conserva la dirección pública canónica. Cuando GoDaddy/Airo presenta
la aplicación mediante otra URL de vista previa, el servidor acepta también las
solicitudes que el navegador identifica explícitamente con
`Sec-Fetch-Site: same-origin`, siempre con un origen HTTPS válido. Normaliza ese
origen internamente antes de aplicar las verificaciones existentes de las API.
No se confía en `X-Forwarded-Host`, no se habilita CORS y se siguen rechazando
orígenes externos, opacos (`null`) o de otro sitio. Navegadores/clientes sin Fetch
Metadata deben utilizar el origen configurado en `APP_ORIGIN`.

## Diagnóstico

El registro `[REPINDSA]` indica la etapa que falla: configuración, base de datos,
Next.js o puerto. Los mensajes no imprimen contraseñas ni conexiones completas.
La aplicación no anuncia estar lista hasta completar la inicialización y abrir
el puerto. Un proceso sin `DB_HOST` sigue usando el adaptador local y en producción
rechaza almacenamiento temporal salvo que exista un volumen explícitamente configurado.

`server.js` fija el directorio de trabajo desde su propia ubicación y las
migraciones localizan los SQL respecto a sus archivos. La conexión remota no
requiere crear una carpeta local `data`. El esquema existente de SQLite se adapta
a MySQL: texto, índices, upserts y contadores con bloqueo dentro de transacciones.
Las migraciones DDL de MySQL son reanudables y se marcan después de completarse,
ya que MySQL confirma DDL implícitamente. Los lotes de datos utilizan transacciones
reales y revierten también los eventos de auditoría si fallan.

## Desarrollo y comprobaciones

Sin variables externas, `npm run dev` usa `data/repindsa.db` y `data/uploads`,
ignorados por Git. No crees worktrees para tareas normales en el entorno aislado.

```bash
npm ci
npm test
npm run typecheck
npm run test:flows
npm run build
npm run dev
```

Las pruebas de integración MySQL requieren un servidor de prueba cuya cuenta pueda
crear una base y un usuario temporales. Nunca ejecutes estas pruebas contra una cuenta de producción:

```bash
MYSQL_TEST_HOST=127.0.0.1 MYSQL_TEST_PORT=3307 MYSQL_TEST_USER=root npm test
# Después de npm run build, verificar HTTP con usuario sin SUPER/TRIGGER:
MYSQL_TEST_HOST=127.0.0.1 MYSQL_TEST_PORT=3307 MYSQL_TEST_USER=root npm run test:mysql:startup
```

La contraseña de pruebas, si corresponde, se proporciona privadamente mediante
`MYSQL_TEST_PASSWORD`. Las pruebas crean y eliminan únicamente una base aleatoria
con prefijo `repindsa_test_`. Sin servidor configurado esa integración se omite de
forma explícita; las demás pruebas siguen ejecutándose.

## Respaldo y ejemplos anteriores

Se conserva `migration/repindsa-backup.enc` y su información para una eventual
recuperación separada. No se importan en la instalación nueva. El importador antiguo
es para SQLite/libSQL y no se ejecuta automáticamente en MySQL. Conserva el archivo
privado de la clave fuera de GitHub; no publiques credenciales.

`app/data/frisa-example.json` y `template-examples.json` contienen demostraciones
nuevas, no cotizaciones originales recuperadas. Se cargan únicamente por solicitud
explícita del administrador, no durante el inicio.
