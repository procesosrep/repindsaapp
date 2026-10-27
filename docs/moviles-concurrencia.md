# Dispositivos y acceso simultáneo

Materiales incluye navegación inferior para teléfono, acciones táctiles, menú de cuenta, tarjetas, formularios en una columna y protección de las áreas del dispositivo (cámara y barra de inicio). Las tablas anchas de otros módulos mantienen desplazamiento dentro de su contenedor. Las ventanas y el editor se adaptan al alto disponible. El manifiesto permite abrir un acceso directo con presentación independiente cuando el navegador lo admite; no proporciona trabajo sin conexión ni convierte el sitio en una aplicación nativa.

La verificación automatizada en Chromium cubre acceso, lista de Materiales, navegación móvil, cuenta, captura, categorías, acciones y visor de documentos en anchos de 320, 375, 390, 667 (horizontal), 768, 1024 y 1440 píxeles. Utiliza datos simulados para verificar la interfaz. El editor prueba imágenes, redimensionamiento, pantalla completa y ausencia de desbordamiento en esos anchos. No equivale a una certificación de todos los modelos de dispositivo ni de Safari y Firefox; conviene probar los teléfonos de los usuarios antes de publicar.

El editor abre pantalla completa mediante la API del navegador. Cuando no está disponible, se monta fuera de las ventanas del sistema y ocupa todo el área visible. Escape o el botón Reducir devuelven al documento. Selecciona una imagen y arrastra el control de su esquina para redimensionarla manteniendo proporciones. El control también admite flechas del teclado. El ancho se conserva en el guardado y en la impresión.

No hay un máximo programado de usuarios registrados o sesiones activas por licencia. Cada inicio crea una sesión independiente; cerrar una no cierra las otras. Cambiar la contraseña o desactivar una cuenta sí revoca sus sesiones por seguridad. Las pestañas de un mismo perfil de navegador comparten la cookie y, por tanto, la cuenta; para probar cuentas diferentes utiliza perfiles de navegador o dispositivos separados.

Las conexiones MySQL se comparten mediante un pool de cinco conexiones: no son cinco usuarios, y las consultas se atienden por turnos. La capacidad simultánea real está limitada por CPU, memoria, conexiones, almacenamiento y cuotas de GoDaddy. No existe capacidad de usuarios ilimitados en un hosting finito. La prueba local verifica 12 cuentas con 24 sesiones en paralelo, 12 borradores creados simultáneamente con folios distintos, privacidad entre usuarios, cierre de una sola sesión y un conflicto real de edición (una escritura aceptada y otra HTTP 409). Este resultado no establece la capacidad ni el tiempo de respuesta del plan contratado.

Los accesos correctos dejan de consumir el presupuesto de intentos fallidos. Se mantienen límites de protección frente a ataques y ráfagas de autenticación: 20 intentos pendientes/fallidos por cuenta y 200 por dirección de origen en una ventana de 15 minutos. No son límites de usuarios conectados. Las sesiones vencidas y su selección de espacio se limpian al iniciar sesión; se agregaron índices por cuenta y vencimiento para que estas operaciones no recorran toda la tabla.

## Reproducir las comprobaciones

- `npm run test:editor`: requiere Chromium instalado; acepta `CHROMIUM_PATH` o el navegador descargado mediante `npx playwright-core install chromium`.
- `MYSQL_TEST_HOST=127.0.0.1 MYSQL_TEST_PORT=3307 RUN_BROWSER_TESTS=1 npm run test:mysql:startup`: requiere compilación previa y un servidor MySQL exclusivo de pruebas con permiso para crear una base y un usuario temporales. Nunca apuntar a la base de producción.
- `npm run test:flows`, `npm test`, `npm run typecheck` y `npm run build` completan las comprobaciones de flujos y código.

Después de actualizar la vista previa, revisar en los teléfonos de uso habitual y publicar la versión probada. La capacidad del hosting debe medirse con una carga representativa en un entorno de pruebas del mismo plan, sin enviar pruebas masivas a la base compartida con producción.

## Selección y vista previa de Materiales

En teléfono, el catálogo de una categoría muestra tarjetas sin desplazamiento horizontal. El nombre y el checkbox permanecen en la misma fila. Al marcar un artículo se muestran inmediatamente su cantidad y la sección Más detalles dentro de esa tarjeta. La búsqueda no activa automáticamente el teclado al abrir una categoría. Las categorías sin selección muestran una flecha de apertura en lugar de un cuadro que pudiera confundirse con un checkbox.

Las instrucciones se consultan en Ayuda o Cómo seleccionar, cerradas inicialmente. Las sugerencias y el control de guardado automático se muestran en el paso de datos generales; el paso de artículos conserva un estado breve del borrador.

Vista previa abre una pantalla de lectura dentro de la aplicación, sin abrir pestañas ni generar un PDF. En móvil utiliza tarjetas legibles por partida; en escritorio muestra el formato imprimible. Volver a la solicitud, Escape y Atrás del navegador cierran la vista y conservan los artículos y cantidades capturados. La vista no guarda, envía ni modifica la solicitud. Imprimir / PDF es una acción independiente, y el formato abierto para impresión incluye Cerrar y volver a la solicitud.
