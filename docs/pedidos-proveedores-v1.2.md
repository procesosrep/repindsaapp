# Pedidos y proveedores · V1.2

Pedidos es el documento equivalente a orden de compra. Se encuentra en Ciclo 3 · Suministros, junto a Proveedores. También se abre desde Materiales; Tesorería tiene un enlace a Pagos de pedidos desde Viáticos. El folio propio del pedido es P-año-consecutivo y se conserva desde el borrador hasta el pago. Las requisiciones de materiales se referencian por partida sin cambiar sus folios ni su atención física.

## Emisión y autorización

El emisor selecciona un proveedor o registra uno nuevo con los permisos correspondientes, indica proyecto/centro de costo, solicitante, uso, condiciones de pago, lugar y tiempo/fecha de entrega. Las partidas contienen requisición, SKU, descripción del material o servicio, cantidad, unidad, precio e IVA. El servidor calcula subtotal, IVA y total, y no acepta importes ni autorizaciones prefabricadas por el navegador.

El borrador sólo lo consulta su emisor. Al enviar pasa a Pendiente de autorización de Dirección. Un director no puede autorizar su propio pedido. Dirección puede autorizar, rechazar o devolver con un motivo. Una devolución permite que el emisor ajuste y vuelva a enviar el mismo folio. Antes de cualquier pago, Dirección también puede devolver un pedido autorizado para corregir datos. Los pedidos emitidos no se modifican directamente por Compras, proveedores ni Tesorería.

El formato imprimible incluye identidad de REPINDSA, proveedor, condiciones, entrega, proyecto/centro de costo, requisición/SKU por partida, subtotales, IVA, total e importe en letra, datos bancarios y responsables de emisión, autorización y pago. Los borradores y pedidos sin autorización se identifican claramente. «Imprimir pedido / PDF» permite imprimir o guardar como PDF.

## Proveedores

Proveedores guarda razón social/nombre, RFC, domicilio, país, contacto, correo, teléfono, beneficiario, banco, cuenta y CLABE. Las altas quedan inmediatamente disponibles en el selector de proveedores de futuros pedidos. Se evita duplicar el RFC o nombre normalizado, incluso en altas simultáneas. Las bajas son desactivaciones: retiran el proveedor de nuevos pedidos, conservando su historial y los pedidos existentes.

El pedido conserva una copia de los datos del proveedor al enviarlo. Cambiar una cuenta bancaria o desactivar al proveedor posteriormente no altera lo revisado y autorizado. Si el proveedor cambió desde la captura, el emisor debe actualizar antes de enviar. Para un pago por transferencia, el pedido debe contener banco y cuenta o CLABE; si falta, debe devolverse antes del pago para ajustar y autorizar otra vez.

## Tesorería

Sólo Tesorería con permiso de pagos de pedidos aplica pagos a pedidos autorizados. Cada pago requiere importe, forma, referencia y comprobante PDF, JPG o PNG. Se permiten pagos parciales sin exceder el saldo. El pedido pasa de Autorizado a Pago parcial y finalmente Pagado. Se rechaza reutilizar el mismo comprobante y se evitan pagos/autorizaciones simultáneos mediante la revisión del documento y un bloqueo transaccional. El mismo actor no autoriza y aplica el pago.

Los pagos se registran dentro del expediente del pedido. No ejecutan transferencias bancarias ni modifican automáticamente las cuentas de Viáticos o los movimientos de inventario. Emisor, Dirección y Tesorería consultan los comprobantes según sus permisos y alcance.

## Configuración y móvil

Configuración → Usuarios, niveles y permisos → Pedidos y proveedores permite habilitar emisión, autorización de Dirección, aplicación por Tesorería, consulta, altas, edición de datos y baja/reactivación de proveedores. Por defecto Compras y Almacén pueden emitir pedidos y administrar proveedores; pueden habilitarse otros emisores. Los permisos de edición de proveedores y cambio de estado se validan por separado, también en servidor.

Las listas muestran veinte registros por página y ordenan desde sus encabezados. Captura, proveedor, detalle, decisión y aplicación de pagos se adaptan a móvil. Los módulos de solicitud de materiales, compra/surtido e inventario mantienen sus autorizaciones, cantidades y confirmaciones independientes.

La solicitud recibida por Compras ofrece «Crear pedido (opcional)» si el usuario tiene permiso de emitir pedidos. Abre una captura precargada con las partidas, cantidades, SKU, proyecto y folio de origen. El emisor elige proveedor y precios y puede ajustar cantidades sin superar las partidas de esa compra en el pedido. El pedido conserva la referencia del origen; no cambia su folio, estado, cantidades, surtido, recepción ni confirmación. Se avisa si ya existen otros pedidos vinculados para revisar duplicidades. El flujo de Compras continúa disponible sin crear un pedido. Los folios P-año-consecutivo se reservan automáticamente por año y no se duplican ante emisiones simultáneas.
