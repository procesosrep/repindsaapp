# Rutas por usuario: Materiales y Viáticos

Sólo el Administrador puede cambiar estas opciones en **Configuración → Usuarios, niveles y permisos → Usuarios → Modificar permisos → Rutas de solicitudes de este usuario**. El servidor verifica el permiso; modificar el formulario o enviar una petición directa no cambia la ruta.

| Nivel, si se elige «Según nivel» | Materiales | Anticipos y comprobaciones de Viáticos |
| --- | --- | --- |
| Director / Dirección | Directo a Almacén | Directo a aplicación |
| Gerente / Gerencia | Directo a Almacén | Autorización → Aplicación |
| Otros niveles | Autorización del responsable → Almacén | Visto bueno → Autorización → Aplicación |

El Administrador puede sustituir esos valores para un usuario concreto, incluso exigir el flujo completo a un director o permitir una excepción a otro nivel. El perfil Administrador, por sí mismo, conserva el flujo completo; puede recibir una ruta explícita. La ruta no concede permisos de creación, autorización, surtido ni pagos: habilita también **Solicitar materiales** o **Solicitar Viáticos y comprobar gastos** en ese usuario cuando corresponda.

Para Viáticos con visto bueno debe configurarse un jefe directo activo y distinto del solicitante. Las rutas con autorización usan los autorizadores financieros configurados: basta uno de ellos y no se permiten autorizaciones propias. La ruta directa a aplicación registra una autorización por política configurada, sin inventar el visto bueno ni la firma de otra persona.

La aplicación corresponde al usuario con permiso de pagos. Todo movimiento monetario exige su comprobante. Las comprobaciones directas quedan con **revisión fiscal pendiente** hasta que Tesorería revise CFDI, soporte, finalidad y tratamiento fiscal. Un gasto no se vuelve deducible por omitir etapas; se conservan los controles de folios/UUID duplicados, declaraciones sin soporte, saldos y reintegros. Los anticipos con bloqueo por comprobaciones vencidas conservan ese control.

Materiales directo permite que Almacén reciba la solicitud, sin registrar una autorización ficticia de Gerencia. Las cantidades, compras, existencias, entregas parciales, confirmación del solicitante y bloqueo por recepciones vencidas conservan sus validaciones.

Las opciones se toman del usuario autenticado al enviar una solicitud nueva o un borrador. No se toman del beneficiario ni de campos enviados por el cliente. Cada solicitud conserva su ruta y el origen de configuración. Cambiar la ruta de un usuario no salta etapas de solicitudes ya enviadas ni modifica registros finalizados.

El seguimiento de Materiales muestra la etapa actual. Una ruta directa registra la solicitud, indica que no requiere autorización y activa el paso 3, «Entrega de Almacén». La entrega sólo queda completada al registrar todas las cantidades y la recepción sólo al confirmarla el solicitante. No se simulan firmas ni recepciones por el nivel del usuario.
