# Viáticos: solicitud, comprobación y aplicación

## Configuración inicial

En Configuración → Usuarios, niveles y permisos:

1. En cada solicitante, elige «Jefe directo · Visto bueno de Viáticos». Debe ser otro usuario activo con acceso a Viáticos y permiso de visto bueno o autorización.
2. En Responsables de flujos, elige al Director de Administración y Finanzas y los alternos en «Viáticos · Autorización de Administración y Finanzas».
3. Concede al aplicador el permiso de registrar pagos en Tesorería. Los permisos de administración de usuarios y configuración siguen reservados al Administrador.

El jefe directo y el autorizador final deben ser personas distintas del solicitante y entre sí. Los alternos son equivalentes: la primera autorización válida cierra la etapa, no se requieren todas las firmas. El solicitante puede indicar un autorizador preferente, pero cualquiera de los autorizadores configurados puede resolver; esa preferencia no limita la facultad de los demás. El expediente conserva los responsables asignados al enviarse; cambiar la configuración no reescribe su historial. No se permite retirar facultades o desactivar a un responsable mientras tenga pendientes asignados.

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
