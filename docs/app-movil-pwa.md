# Aplicación móvil REPINDSA (PWA)

Dirección de producción: https://repindsa-app.com. Mantiene V1.2, usuarios, permisos y base de datos. No requiere tiendas ni APK.

## Publicación

Desplegar `main` mediante el proceso habitual y mantener `APP_ORIGIN=https://repindsa-app.com` en la configuración del hosting. HTTPS válido y servicio disponible son necesarios. La configuración de ejemplo incluye ese dominio; no se modifican secretos del hosting desde el repositorio. La aplicación también funciona en vista previa, con instalación independiente para cada dominio.

Verificar `https://repindsa-app.com/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png` y `/instalar`. El servidor envía el worker sin caché HTTP y permite su alcance en `/`. El manifiesto abre `/acceso`, respetando el selector de espacios y sus permisos.

## Instalación

Acceder a https://repindsa-app.com/instalar, también enlazado desde inicio de sesión y selector de espacios.

- Android: Chrome → Instalar REPINDSA cuando esté disponible, o menú → Instalar aplicación / Agregar a pantalla principal.
- iPhone/iPad: Safari → Compartir → Agregar a pantalla de inicio. Activar Abrir como app si aparece. iOS ofrece instalación manual; no se simula una instalación nativa.

Se usa sólo el símbolo del hexágono del logotipo, sobre fondo blanco, con PNG de 192 y 512 px, versión maskable y Apple Touch Icon de 180 px. El resto del sistema conserva el logotipo completo.

## Conexión, privacidad y actualizaciones

Se requiere internet para consultar y registrar información. El service worker sólo guarda `/offline.html` y dos iconos públicos. No guarda respuestas de API, páginas de usuarios, sesiones, evidencias, movimientos ni pagos; tampoco intercepta POST ni los reintenta en segundo plano. La navegación se consulta en la red y muestra la pantalla pública sin conexión si falla. Al recuperar internet se puede reintentar. Si un envío quedó interrumpido, se indica revisar su estado antes de reenviarlo.

Las pantallas y el código de la aplicación no se guardan en la caché del worker; el sistema utiliza la versión publicada al abrirlo. Cuando cambia el worker aparece un aviso para guardar el trabajo en todas las ventanas y actualizar voluntariamente. No recarga formularios automáticamente. El worker elimina únicamente sus propias cachés públicas anteriores.

La primera versión no incluye notificaciones push ni operación sin conexión. Cerrar sesión conserva los mecanismos de revocación y autenticación existentes.

## Comprobaciones

Compilación y tipos, manifiesto/iconos/encabezados HTTP, guía adaptable Android/iOS, evento de instalación admitido/rechazado, modo standalone, worker real y pantalla sin conexión, APIs sin caché y retorno a la red. También se mantienen las pruebas de Viáticos y Materiales.
