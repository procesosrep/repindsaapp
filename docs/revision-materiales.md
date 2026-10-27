# Revisión técnica y salida de Materiales

## Alcance y arquitectura

La prioridad de esta revisión es el primer despliegue de solicitudes de materiales.
Las correcciones compartidas también benefician a los demás módulos, cuyos flujos
existentes se verifican en la suite general; no se han activado módulos ni cambiado
los datos de la cuenta de GoDaddy desde este entorno.

- `server.js`: entrada Node.js para GoDaddy, configuración, migraciones, auditoría,
  salud y normalización de origen de la vista previa.
- `app/material-composer.tsx` y workspace: captura y seguimiento en el navegador.
- `app/api/material-workspace`: borrador y envío, proyectos/RP, catálogo y permisos.
- `app/api/cash`: autorización y atención de Almacén; conserva el nombre histórico
  del endpoint, pero contiene también acciones de materiales.
- `app/api/purchase-workspace` y `app/api/material-receipts`: compra, recepción
  física, diferencias y confirmación final.
- `app/access-policy.ts`: política común de perfiles, espacios y acciones.
- `server/mysql*.mjs`: adaptación MySQL, transacciones, bitácora y adjuntos privados.

La compatibilidad SQL heredada está delimitada en el adaptador. Una migración
completa del modelo de registros JSON a tablas de dominio requeriría un proyecto
separado; no se han hecho conversiones masivas sobre datos existentes.

## Correcciones realizadas

1. Envío exige al menos una partida, cantidad positiva y unidad; los borradores
   siguen permitiendo captura incompleta. No se crean solicitudes vacías ni con
   cantidades en blanco por llamadas directas a la API.
2. Las rutas aún no configuradas de otros módulos pueden quedar vacías. Se puede
   configurar sólo Materiales; se rechaza quitar un responsable existente sin
   reasignarlo y el alterno puede tener sólo autorización de Materiales. La prohibición de autoautorización aplica también al administrador inicial sin perfil personalizado.
3. Plantillas y usuarios comparten la validación de dependencias de permisos.
   Las casillas agregan el espacio necesario al habilitar una acción y quitan
   acciones dependientes al deshabilitar el espacio. Cambiar perfil propone sus
   valores base. El perfil Administrador conserva su acceso completo efectivo.
4. Los bloqueos mutuos MySQL reintentan el lote completo hasta dos veces, con
   rollback previo. No se reintentan errores de red ni resultados de commit
   inciertos. Las pruebas verifican un único registro y evento auditado tras retry.
5. Las descargas comprueban secuencia de bloques y longitud guardada; un archivo
   incompleto produce error en lugar de entregar una descarga parcial silenciosa.
6. La inicialización de catálogo se comparte por conexión lógica y se reutiliza
   en consultas posteriores. Las ediciones de artículos se consultan siempre.
7. El límite de login por cuenta permanece en 20 intentos por ventana de 15 minutos;
   el límite de IP es 200 para no bloquear a todos los usuarios detrás del proxy de
   GoDaddy al agotarse una cuenta. No se confía en una IP enviada por el cliente.
8. GitHub Actions incluye MySQL real y una prueba HTTP con usuario de base sin
   SUPER/TRIGGER, además de la suite existente, tipos y compilación.

## Verificación reproducible

`npm test`, `npm run typecheck`, `npm run test:flows`, `npm run build`.
Para las integraciones MySQL, configurar `MYSQL_TEST_HOST`, puerto y credenciales
exclusivos de pruebas. `npm run test:mysql:startup` crea una base y usuario
aleatorios y los elimina al terminar. Nunca usar una cuenta de producción.

La prueba HTTP cubre usuarios separados de solicitante, autorizador y Almacén,
rutas sólo de materiales, envío inválido, borrador, envío, rechazo de revisión
obsoleta, rechazo de autoautorización, autorización asignada, entrega y confirmación
por el solicitante. La suite conectada adicional cubre compras, entregas parciales,
envío a sitio, faltantes, resolución y re-confirmación.

## Comprobación antes de publicar

1. Exportar un respaldo SQL de GoDaddy; Vista previa y Publicado comparten la base.
2. Actualizar Vista previa al commit de esta revisión y entrar con el administrador.
3. Revisar usuarios activos y permisos de solicitante, autorizador y Almacén.
4. Configurar el autorizador principal de Materiales, un alterno distinto del
   solicitante y el responsable de Almacén; agregar Compras si se probará ese tramo.
5. Confirmar los proyectos/RP recuperados y artículos del catálogo. Los proyectos
   cerrados o fuera del alcance del usuario no deben aparecer como seleccionables.
6. Recorrer una solicitud de prueba con cuentas separadas y marcarla claramente
   como prueba; verificar bitácora y adjuntos tras recargar/reiniciar.
7. Verificar también reducción/rechazo con motivo, entrega parcial, compra y
   confirmación de diferencias según los roles reales.
8. En Publicado, conservar la misma conexión MySQL y usar APP_ORIGIN del dominio
   HTTPS definitivo. Publicar desde GoDaddy después de verificar la vista previa.

El catálogo de artículos no es un libro de existencias físicas: Almacén registra
la disponibilidad y entrega de cada solicitud. No se ha añadido contabilidad de
inventario ni se han inferido saldos de stock del catálogo histórico.

Las pruebas locales no verifican el plan, cuotas, DNS, respaldos automáticos ni la
configuración efectiva de la cuenta GoDaddy. La auditoría de aplicación registra
las operaciones hechas mediante el adaptador; cambios directos desde clientes SQL
externos no pasan por esa auditoría si no existen triggers heredados.
