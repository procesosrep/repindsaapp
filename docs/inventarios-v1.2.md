# V1.2 · Inventarios por proyecto y control del catálogo

Inventarios pertenece al Ciclo 3 · Suministros. La pantalla abre en Existencias y muestra los artículos aprobados, su categoría, unidad y cantidad. Filtros, resumen, categorías y ubicaciones se despliegan cuando hacen falta. Una sola selección permite registrar movimientos. En móvil, la navegación usa un selector, tarjetas y controles que caben en pantalla; conserva todas las acciones autorizadas.

## Almacenes y movimientos

Existe un almacén principal, general y siempre activo. Los subalmacenes dependen del principal y requieren un proyecto. Cada almacén tiene dirección, responsable y ubicaciones internas. No se pueden eliminar ubicaciones con saldo o préstamos, cambiar el proyecto de un almacén con operaciones pendientes ni desactivar almacenes con saldos o préstamos abiertos.

Las entradas distinguen compra, devolución de proyecto, existencia inicial, ajuste y otra entrada. Se registran también salidas, traslados entre almacenes/ubicaciones, préstamos y bajas por daño con evidencia obligatoria. Cada movimiento conserva usuario, fecha, artículo, unidad, cantidad, origen, destino, referencia y evidencia. Las salidas manuales requieren saldo suficiente en la ubicación; los saldos negativos históricos se conservan para conciliación.

Los préstamos conservan identificación del equipo, responsable y fecha prevista. Admiten devoluciones parciales y recepción en el principal u otro almacén activo. Las devoluciones no pueden superar la cantidad pendiente. Se mantiene el vínculo con la solicitud y el proyecto originales.

El surtido de materiales continúa independiente: no descuenta automáticamente inventario ni se bloquea por falta de existencias. Los artículos aprobados aparecen con existencia inicial cero hasta registrar entradas. Las sugerencias son informativas y no sustituyen la revisión física.

## Artículos agregados desde solicitudes

El botón sigue llamándose **Agregar artículo**. Lo agregado queda pendiente de validación, sin crear existencias ni un producto definitivo. La solicitud y Compras pueden continuar. Almacén revisa desde Artículos por validar y puede autorizar el alta definitiva, vincular a un artículo existente o pedir aclaración al solicitante. La unificación comprueba unidades y códigos; conserva descripción original, cantidades, entregas e historial. Los movimientos de inventario requieren un artículo definitivo.

Los permisos separados son Consultar/revisar artículos, Autorizar alta de artículos y Vincular/unificar artículos, dependientes de Almacén. El Auxiliar puede revisar y pedir aclaraciones; alta y unificación requieren habilitación. El permiso de agregar desde solicitudes no concede administración de catálogo. Los directores requieren asignación explícita para estas acciones.

El selector Entrega (Consumo/Préstamo) está en **Más detalles** de cada partida. Sólo Almacén autorizado corrige posteriormente esa clasificación, con motivo e historial, conservando las cantidades físicas y las devoluciones reales.

## Continuidad y concurrencia

La estructura anterior se migra conservando identificadores y movimientos. Se reutiliza el almacén general existente como principal cuando es posible; los almacenes antiguos sin proyecto requieren asignación antes de nuevos movimientos. Los nombres internos de almacenamiento anteriores se conservan para compatibilidad, sin referencias a piloto en la interfaz.

Las escrituras de inventario verifican revisión y sesión. La aprobación de artículos y la resolución de sus referencias se realizan en una transacción, con control de revisión y códigos únicos. Las referencias de solicitudes se resuelven al leer sin reescribir su historial ni sus cantidades.
