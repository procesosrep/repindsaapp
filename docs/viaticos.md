# Viáticos: solicitud, comprobación y aplicación

## Configuración inicial

En Configuración → Usuarios, niveles y permisos:

1. Configura la ruta de cada solicitante en «Rutas de solicitudes de este usuario». Si incluye visto bueno, elige «Jefe directo · Visto bueno de Viáticos»: otro usuario activo con acceso y permiso de visto bueno o autorización. Consulta [rutas por usuario](rutas-solicitudes.md).
2. En Responsables de flujos, elige al Director de Administración y Finanzas y los alternos en «Viáticos · Autorización de Administración y Finanzas».
3. Concede al aplicador el permiso de registrar pagos en Tesorería. Los permisos de administración de usuarios y configuración siguen reservados al Administrador.
4. Pulsa **Guardar flujo de Viáticos y responsables** al final. Este botón guarda también los autorizadores marcados; el aviso de cambios pendientes desaparece sólo después de confirmar el guardado. Al volver a abrir la configuración, las selecciones deben mantenerse.

Cuando la ruta incluye visto bueno y autorización, el jefe directo y el autorizador final deben ser personas distintas del solicitante y entre sí. Las rutas directas registran las etapas exentas por configuración, conservando la revisión fiscal de las comprobaciones en aplicación. Los alternos son equivalentes: la primera autorización válida cierra la etapa, no se requieren todas las firmas. El solicitante no elige autorizador. Los responsables se asignan desde la configuración y cualquiera de los autorizadores habilitados puede resolver la etapa. Los pendientes de visto bueno y autorización usan los autorizadores financieros explícitamente configurados y sus permisos vigentes. Al actuar se guarda esa asignación y su revisión de configuración en el historial; las aprobaciones y pagos anteriores conservan sus responsables. El jefe directo que dio visto bueno no se cambia. No se permite retirar facultades o desactivar a un responsable mientras tenga pendientes asignados.

## Flujo y bandejas

- Anticipo: solicitante → visto bueno del jefe directo → autorización de Administración y Finanzas → aplicación del pago → pendiente de comprobación.
- Comprobación: solicitante → visto bueno del jefe directo → autorización de Administración y Finanzas → aplicación; puede generar reembolso o devolución.
- El anticipo se cierra cuando queda liquidado y no existen comprobaciones pendientes. Los pagos y comprobaciones parciales conservan el saldo restante.

Cada responsable tiene una bandeja tabular, búsqueda, selección individual y selección de hasta 100 expedientes. Visto bueno y Autorización permiten decidir masivamente: aprobar, rechazar, devolver, dejar en espera y reanudar. Cada expediente conserva su resultado; los errores se muestran individualmente. Las operaciones masivas financieras se aplican de forma secuencial para capturar el comprobante y referencia de cada pago. «Históricos» conserva decisiones y aplicaciones; los registros aprobados también permanecen en Aplicar hasta ser atendidos.

Las tablas muestran anticipo/comprobación, conceptos del gasto, tratamiento fiscal, importe, importe comprobado, saldo y etapa. La intención de deducibilidad de una solicitud es provisional; una comprobación deducible requiere revisión expresa de CFDI, XML, pago y finalidad. Si presenta observaciones, el autorizador debe aceptar expresamente el tratamiento No deducible o devolverla.

## Soportes y controles

Cada gasto debe tener soporte; en su ausencia se exige marcarlo No deducible, explicar la causa y aceptar la declaración completa bajo protesta de decir verdad. El servidor registra el texto, usuario y fecha. La declaración no sustituye un CFDI. Las aplicaciones con movimiento monetario requieren imagen o PDF del comprobante, fecha, medio y referencia. Registrar una aplicación no ejecuta una transferencia bancaria.

UUID y folios normalizados se reservan al enviar, con restricciones únicas transaccionales. Para atender la regla de no reutilizar folios, el control del folio es global, aun entre distintos proveedores; los expedientes rechazados conservan su reserva. Una corrección debe devolverse y reenviarse con el mismo expediente. También se revisan los datos anteriores que todavía no tenían reserva. Las decisiones y pagos usan revisiones optimistas; una actualización de pantalla no cambia la versión seleccionada para decidir.

El servidor impide autorizar etapas propias, saltar el visto bueno, pagar antes de la autorización, repetir un movimiento o exceder el saldo. Los adjuntos se consultan con los permisos del expediente y se conservan en MySQL. El cambio de sesión cierra la captura activa y las operaciones/archivos verifican el usuario esperado.

## Continuidad

Se conservan las rutas técnicas `/caja`, el identificador de permiso `box` y los registros financieros existentes. El nombre visible es Viáticos. Los pagos previamente autorizados continúan disponibles en Aplicar. Los pendientes del flujo anterior se muestran identificados; el solicitante o Administrador debe incorporarlos al nuevo flujo, revisar soportes y reenviarlos. Se conservan folios e historial. La captura anónima de nuevos Viáticos se bloquea porque no permite asignar al jefe directo de un usuario.

## Verificación

Pruebas HTTP con MySQL aislado para secuencia, permisos, alternos concurrentes, esperas, decisiones masivas, declaración sin soporte, comprobación parcial, excedentes, devoluciones, cierre, folios/UUID repetidos y reintentos de pago. Navegador a 320, 390, 667 horizontal, 768 y 1440 px para bandejas, acciones masivas, carga de pago, captura y protección de revisiones. Los datos de navegador son simulados; las transacciones se verifican por separado con MySQL.

La configuración habitual no muestra los controles de pruebas de recepción ni el autorizador del flujo antiguo. Las asignaciones históricas se conservan internamente. Los perfiles y niveles personalizados de Dirección se validan con los mismos permisos efectivos al configurar y al enviar. La API identifica esta revisión con la cabecera `X-REPINDSA-Viaticos-Flow: 4`; el antiguo aviso «Configura al Director de Administración y Finanzas y sus autorizadores alternos en el flujo de Viáticos» pertenece a una versión anterior y requiere actualizar el entorno que atiende la solicitud. Vista previa y publicado se actualizan por separado.

«Ver detalles» muestra solicitante, beneficiario, proyecto/RP, motivo, periodo, plazo de comprobación, conceptos, importes, datos bancarios y soportes. La misma información se muestra antes de confirmar una decisión, usando la revisión seleccionada aunque la bandeja se actualice. La falta de jefe directo para las solicitudes propias de un director no bloquea su bandeja de autorizaciones recibidas.

La comprobación comparte la selección de beneficiario con el anticipo: el usuario autenticado es el beneficiario por defecto y «Solicito para otra persona» permite reutilizar beneficiarios o registrar una persona con cuenta bancaria validada. En reembolsos para otra persona los datos bancarios son obligatorios; cuando pagó la empresa no se genera un reembolso y la cuenta es opcional. El periodo es opcional en comprobaciones independientes. Las vinculadas conservan beneficiario, cuenta, proyecto y periodo del anticipo pagado; el servidor impide sustituirlos. Los datos de viaje para revisión fiscal están agrupados en una sección desplegable y los comprobantes y declaraciones por gasto mantienen sus validaciones.

Los anticipos y comprobaciones utilizan un consecutivo anual compartido: `V-2026-00001`. La migración automática aplica también a los existentes, conserva los folios anteriores como referencias, respalda los registros modificados y mantiene intactos los identificadores, facturas, movimientos e historial. Los comprobantes internos de Tesorería y los demás módulos conservan su nomenclatura.

La captura de la comprobación solicita el folio de factura y no requiere capturar UUID ni los datos del viaje. El UUID que contenga un XML adjunto sigue sirviendo internamente para detectar facturas duplicadas. Se conserva la revisión fiscal; un folio capturado no convierte automáticamente el gasto en deducible. El campo «¿Quién pagó?» se retira de la captura; se conservan los datos históricos y se excluye el combustible Intelyvale de los reembolsos.

El control de saldos por tarjeta se explica en [Combustible con Intelyvale](intelyvale.md).

Al enviar una comprobación se exige folio de factura por partida, tanto deducible como no deducible, con la única excepción de Combustible. Las comprobaciones históricas ya enviadas conservan sus datos. La revisión masiva presenta cada solicitud en un desplegable con folio, persona, importe y número de partidas; los soportes y las verificaciones fiscales se consultan dentro de esa solicitud. Los datos y revisiones seleccionados se conservan mientras se confirma la decisión.

Las listas de Viáticos muestran veinte solicitudes por página y permiten ordenar desde los encabezados, incluidas fechas e importes, sin usar filtros. La selección masiva se limita a la página visible y se limpia al cambiar de página, orden o búsqueda; la confirmación mantiene la copia de los datos seleccionados para evitar autorizar una revisión distinta.

La captura ya no solicita un motivo general: se describe el propósito en cada partida. El servidor conserva una síntesis para búsqueda y compatibilidad, sin pedir una segunda captura. Los registros históricos mantienen sus datos y pueden mostrar el motivo anterior cuando una partida no tenía descripción. No cambian el visto bueno, la autorización, las validaciones fiscales ni los comprobantes de pago. Las ventanas de captura y revisión abren a todo el ancho, con opciones de reducir, ampliar y pantalla completa; la auditoría de autorizaciones se consulta en un desplegable.
