# Compras por partida · V1.1

Al emitir una compra desde Materiales se conserva el mismo folio. Las compras directas de abastecimiento conservan un folio propio. Al iniciar la aplicación se unifican las compras vinculadas anteriores con su solicitud de origen; se guardan su folio anterior, historial y respaldo. Los identificadores internos y los vínculos no cambian.

La atención de Compras muestra artículo, cantidad solicitada, estado y entrega aproximada por partida. Cada partida avanza en orden: Emitida → Cotizado → Comprado → Entregado a almacén o Enviado a sitio. No es necesario que todas avancen juntas. Al marcar Comprado se requiere una fecha de entrega aproximada. La fecha general muestra la última fecha informada entre las partidas y se comparte con el seguimiento de Materiales.

«Agregar detalles» es opcional: permite guardar comentarios, dudas, cantidad informada y precio unitario. La cantidad informada es una referencia para documentar diferencias; no modifica la cantidad autorizada, genera pagos ni sustituye la recepción física. El precio tampoco representa una autorización de pago.

Almacén sólo puede recibir las partidas marcadas como entregadas a Almacén. Las partidas en cotización o compra siguen pendientes, aunque otras de la misma solicitud ya estén recibidas. Compras no puede confirmar una recepción. Los envíos a sitio siguen requiriendo confirmación del solicitante y permiten resolver diferencias y reenviar faltantes por la misma ruta.

En móviles la tabla se organiza por partida con etiquetas y los detalles permanecen cerrados hasta solicitarlos. El encabezado de Materiales muestra el nivel configurado del usuario, separado de su función en la pantalla de captura.

El acceso muestra «Compras» para el usuario autorizado de seguimiento. Al elegir el espacio se recupera el registro de sesión si falta, y repetir la selección del mismo espacio es seguro. El cliente reintenta hasta tres veces el cambio de espacio o la carga de bandeja ante respuestas temporales 502/503/504. Una respuesta de texto del alojamiento se muestra con un mensaje comprensible; no se interpreta como JSON ni provoca reenvíos automáticos de contraseñas o decisiones de compra. Si la indisponibilidad del alojamiento persiste, el usuario conserva su sesión y puede volver a seleccionar el espacio.

## Atención parcial de Compras

La cantidad comprada y la cantidad enviada son acumuladas y se controlan por separado de la cantidad originalmente solicitada. Por ejemplo, de diez unidades se pueden comprar tres y enviar esas tres a Almacén; Almacén recibe sólo esas tres, las entrega y el solicitante confirma ese lote. Las siete restantes conservan su pendiente y se atienden después con otro lote. También funciona cuando se atienden tres partidas distintas de una solicitud de diez partidas.

En la tabla, «Comprado acumulado» y «Enviado acumulado» permiten indicar cantidades parciales. Los envíos pueden ir a Almacén o directamente a sitio por partida; una partida que ya tiene un destino conserva su ruta. Los importes y comentarios opcionales no sustituyen estas cantidades operativas.

Almacén ve de inmediato las entregas disponibles en «Por atender», aunque otras partidas sigan en Compras. «Recibir entrega» muestra únicamente lo que está anunciado para Almacén. Después de la recepción física se habilita el surtido de esas cantidades. Los envíos a sitio generan una confirmación del solicitante por lote, sin esperar al resto de la solicitud.

Se muestran los avances de compra, envío, recepción y pendientes. Las notificaciones identifican el avance parcial y las cantidades. No se cierra la solicitud hasta completar y confirmar todas las cantidades autorizadas. La bandeja obtiene también el avance de compras existentes al consultarlas; no se cambian sus folios ni se inventan recepciones históricas.

Las bandejas de Materiales y Compras muestran hasta veinte solicitudes por página. «Anterior» y «Siguiente» recorren los resultados filtrados, y los encabezados ordenan fechas, folios y avances en ambos sentidos. En móvil los encabezados ordenables se presentan como controles compactos sobre la lista. El avance parcial no se pierde al cambiar de página.
