# V1.2 · Ciclo 3: inventario piloto por proyecto

Inventarios aparece en Ciclo 3 · Suministros y desde Materiales para usuarios con permisos de Almacén e inventario. Los artículos registrados en el catálogo aparecen con existencia inicial cero; los artículos históricos de solicitudes que aún no están en el catálogo se incorporan sin duplicarlos. Almacén registra la existencia inicial mediante una entrada, indicando almacén, ubicación, proyecto, cantidad y referencia. No se deducen existencias de solicitudes históricas.

El inventario es informativo. Los movimientos son manuales e independientes del surtido: no bloquean solicitudes por saldo cero o insuficiente ni descuentan automáticamente lo entregado. Se permiten saldos negativos visibles para conciliar el piloto. El detalle de una solicitud muestra existencias generales y del proyecto y sugiere cantidades por partida, sin modificar las cantidades autorizadas ni las recepciones de Compras.

Se registran entradas, salidas, traslados entre ubicaciones/almacenes/proyectos, bajas por daño con evidencia obligatoria y préstamos de equipo con identificación, responsable, proyecto y fecha de devolución. Las devoluciones parciales se relacionan al préstamo, conservan sus datos y no pueden superar el pendiente. No se borra la bitácora. Las correcciones se documentan mediante movimientos compensatorios. Los almacenes se dan de baja conservando su historia; no pueden darse de baja con saldos o préstamos pendientes, ni eliminar ubicaciones con saldo o préstamo abierto.

Configuración → Usuarios, niveles y permisos incluye las acciones independientes de inventario, administración de almacenes, comprobantes, evidencias, diferencias y altas de catálogo. El nivel Auxiliar de Almacén propone consulta, movimientos ordinarios, préstamos y comprobantes; no permite administrar almacenes, dar bajas por daño ni resolver diferencias salvo habilitación del administrador. Los permisos se validan también en servidor y no conceden autorización de solicitudes ni pagos.

Cada entrega de materiales tiene un comprobante imprimible para firma, con folio original, proyecto, cantidades del lote, acumuladas y pendientes. «Comprobante para firma · PDF» abre el formato para imprimir o guardar como PDF. Se puede adjuntar PDF, JPG o PNG firmado a la entrega, hasta cinco evidencias. Adjuntar una firma no confirma automáticamente la recepción ni cierra diferencias.

La recepción admite faltantes, sobrantes, material dañado, distinto u otras diferencias, con cantidades utilizables y explicación. Los sobrantes se registran sin aumentar lo autorizado. La solicitud permanece en Diferencia reportada hasta la resolución por un usuario autorizado; los faltantes no utilizables vuelven a quedar pendientes de surtir y confirmar. El aviso de fecha requerida se muestra desde dos días naturales antes y al vencer, sólo para solicitudes abiertas.

Los nuevos artículos se guardan en el catálogo para solicitudes futuras. SKU y número de parte son opcionales, únicos sin distinción de mayúsculas ni espacios y se conservan una vez registrados. Las coincidencias del catálogo se ofrecen al escribir el nombre o código. El bloqueo de duplicados también opera en servidor, incluso ante altas simultáneas.

Las tablas de existencias y movimientos muestran veinte registros por página, con búsqueda de artículos/códigos, filtro de almacén y proyecto y orden desde encabezados. La interfaz se adapta a móvil.

Las partidas de la solicitud permiten elegir Consumo o Préstamo, con fecha prevista de devolución opcional (se propone el fin del proyecto). Una entrega de préstamo aparece automáticamente en Inventarios → Préstamos, aun si falta confirmar la recepción. Una vez confirmadas las cantidades utilizables, Almacén identifica el equipo, almacén, ubicación y responsable, sin recapturar el producto ni el proyecto. Las entregas parciales se pueden identificar por lotes y devolver parcialmente. El sistema no permite registrar más préstamo que lo entregado y confirmado; el registro y sus devoluciones quedan ligados a solicitud y partida. Confirmar la entrega de materiales no elimina los pendientes de devolución del proyecto.

Los directores conservan las autorizaciones y funciones existentes. Las acciones nuevas de inventario y préstamos se habilitan expresamente en su configuración si también realizan funciones de Almacén; no se activan sólo por tener nivel director. La emisión de pedidos y administración de proveedores también admite estas excepciones por usuario. Administración conserva su acceso de configuración y control.

### Corrección de modalidad por Almacén

Almacén con permiso de préstamos puede corregir Consumo/Préstamo por partida desde el detalle de una solicitud liberada, indicando motivo. Si hay un avance sin guardar, debe guardarlo primero. La corrección conserva cantidades, entregas, recepciones, autorizaciones e inventario físico. Se registra en el historial de la solicitud y en la trazabilidad de clasificación del inventario.

Cambiar a Consumo suspende el pendiente de préstamo sin crear una devolución física. El equipo se identifica como reclasificado y conserva sus devoluciones reales. Al restablecer Préstamo, se recupera únicamente el pendiente real, sin volver a descontar existencias. Se rechaza restablecer un equipo con otro préstamo activo o almacén inactivo.
