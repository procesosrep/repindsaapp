# Compras y recepción simplificadas

## Compras

El perfil Compras entra directamente a su lista de solicitudes de compra. Abre la compra para consultar artículos, cantidades, unidades, características y marca, y registrar el avance. No abre la solicitud de materiales de origen ni el panel de confirmación del solicitante. La referencia de origen y el historial permanecen plegados.

El avance mantiene el flujo Cotizado → Comprado → Entregado a almacén o Enviado a sitio. La pantalla selecciona una opción válida desde el primer momento; antes podía mostrar Cotizado mientras enviaba Emitida. Para marcar Comprado se requiere fecha estimada de entrega. El envío a sitio sólo está disponible cuando existe una solicitud de materiales con responsable de recibir, y se conservan las reglas de entregas parciales y reposiciones.

El perfil predeterminado Compras incluye Materiales y Atender y actualizar solicitudes de compra. No incluye autorización, solicitud de materiales ni recepción física. Almacén conserva por defecto el permiso de crear y emitir compras. Los permisos de crear compras y recibir físicamente se utilizan con el perfil Almacén; Compras se dedica a recibir y atender las solicitudes emitidas. Los perfiles antiguos de Compras que tenían el permiso de Almacén se interpretan como seguimiento de compras, sin cambiar contraseñas ni reiniciar cuentas; el administrador ve los permisos efectivos en Usuarios.

En Usuarios → Responsables de flujos se puede asignar el responsable de Compras. No se inventa un responsable por nombre al actualizar una compra: se conserva el asignado, se utiliza la configuración o quien atiende. El aprovisionamiento anterior de una cuenta concreta sólo se conserva cuando se configuró expresamente mediante su semilla.

Los permisos se evalúan por acción:

- Atender y actualizar solicitudes de compra: cotización, compra y entrega/envío.
- Crear solicitudes de compra: alta y emisión de compras directas; no es requisito para recibir en Almacén.
- Atender Almacén: recepción física de compras y surtido. Para una cuenta encargada de recibir físicamente se utiliza el perfil Almacén, no Compras.

## Recepción del solicitante

La vista principal muestra sólo las entregas que el usuario puede confirmar. Cada artículo tiene cantidad, unidad y casilla Recibido. También se puede marcar toda la entrega. Confirmar recibido se habilita cuando están marcados todos los artículos de esa entrega.

Si algo no coincide, Reportar diferencias permite indicar cantidades reales y comentarios. Los artículos marcados se proponen completos y los no marcados en cero; el usuario puede ajustar cada cantidad. Se requiere una diferencia real y un motivo. La declaración queda en el historial; Almacén conserva su acción de resolución y los faltantes vuelven al flujo de surtido.

Las entregas confirmadas y las confirmaciones de otros usuarios se muestran en un historial plegado. En la recepción del solicitante ya no se repite la tabla técnica completa ni el cuadro Solicitado/Autorizado/Entregado/Confirmado. Ver solicitud original abre la vista de lectura dentro de la aplicación si se necesita consultar el documento.

Se mantienen autorización por propietario, revisiones, plazos, bloqueos por entregas vencidas, urgencias autorizadas, historial y protección de cantidades. Simplificar la pantalla no elimina esas reglas.

## Comprobaciones

Las pruebas incluyen avances válidos desde la emisión, perfiles antiguos y sin perfil personalizado, conservación de contraseñas, rechazo de recepción con la cuenta de Compras, recepción de Almacén sin permiso de creación, casillas, diferencias y ausencia de detalles internos en la pantalla del comprador. Se verifican las pantallas en Chromium a 320, 390, 768 y 1440 píxeles. Las pruebas HTTP usan una base MySQL temporal con privilegios limitados y nunca la base de producción.
