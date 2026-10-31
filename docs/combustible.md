# Control de combustible

## Captura en Viáticos

Los campos de combustible aparecen exclusivamente al seleccionar el concepto Combustible, tanto en anticipos como en comprobaciones:

- Unidad y placas.
- Recorrido declarado por el solicitante, en kilómetros.
- Rendimiento declarado por el solicitante, en km/l.
- Kilometraje anterior y actual.
- Litros solicitados o cargados y precio por litro.
- Rendimiento calculado, de sólo lectura: `(kilometraje actual − kilometraje anterior) / litros`.

Los litros son necesarios para poder calcular un rendimiento independiente del declarado. El importe del combustible se obtiene de litros por precio por litro; debe coincidir con el importe comprobado. El servidor valida números positivos, identidad de la unidad, placas y kilometraje no decreciente. El rendimiento declarado se conserva: no se sustituye por el calculado.

## Bitácora y reportes

Acceso: Ciclo 5 · Finanzas → Control de combustible, o `/combustible`. También hay un enlace desde Viáticos para los perfiles autorizados. El permiso «Consultar bitácora y reportes de combustible» requiere acceso al panel. Dirección y Administración tienen acceso operativo completo; Operaciones y Tesorería lo incluyen en su perfil base. Los demás usuarios pueden recibirlo expresamente desde Configuración. Los alcances de proyecto se respetan; un usuario sin este permiso no puede descargar el CSV.

La bitácora se genera directamente de las partidas de Viáticos, sin volver a capturar datos ni duplicar tablas. Cada evento conserva placa normalizada, unidad, folio de origen, fecha, tipo, etapa, kilometrajes, recorrido, rendimientos, litros, precio e importe. Se conservan también las solicitudes antiguas que ya tenían datos de combustible; sus litros estimados se identifican como tales. No se incluyen borradores ni registros rechazados o cancelados.

Los filtros permiten elegir placa, periodo y solicitudes/comprobaciones. Los movimientos se paginan; la exportación CSV incluye todo el filtro, con formato UTF-8 y protección frente a fórmulas de hoja de cálculo.

El resumen separa litros e importe solicitados de litros e importe comprobados y autorizados. Un anticipo y su comprobación nunca se suman como dos consumos reales. El consumo comprobado usa únicamente comprobaciones autorizadas que contienen litros capturados. Una aplicación financiera pendiente no cambia el hecho de que el gasto ya fue comprobado y autorizado.

El rendimiento consolidado por placa se calcula con kilómetros únicos de los intervalos de odómetro y litros de comprobaciones autorizadas. Los intervalos superpuestos generan una observación y no duplican kilómetros. El rendimiento declarado consolidado se pondera por litros. Las placas con más de una unidad asociada se identifican para revisión.

La captura de combustible conserva el flujo de Viáticos: jefe directo → uno de los autorizadores equivalentes de Administración y Finanzas → aplicación y liquidación. No se omiten soportes, declaración bajo protesta, validaciones fiscales ni controles de folios duplicados.

## Pruebas

- Cálculo independiente de rendimiento, validación de litros/kilometrajes y normalización de placas.
- Solicitud, autorización alternativa, pago, comprobación de combustible y cierre sobre MySQL aislado.
- Reportes y CSV por placa, fechas y permiso; solicitudes y consumo real sin doble contabilización.
- Navegador a 320, 390, 667 horizontal, 768 y 1440 px: campos condicionales, cálculo, filtros y visualización sin desbordamiento horizontal.
