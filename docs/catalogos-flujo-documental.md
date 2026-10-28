# Catálogos y flujo documental

## Proyectos

El administrador abre **Catálogos → Catálogo de proyectos · RP** en el panel, o **Materiales → Administrar proyectos y artículos**. Puede agregar y editar proyectos con RP único, descripción, lugar y cliente obligatorios. El filtro Activo/Inactivo/Todos permite recuperar opciones desactivadas sin borrarlas.

La disponibilidad se guarda en `catalogStatus`; la etapa operativa del proyecto se conserva en `status`. Desactivar retira el proyecto de las opciones nuevas de Materiales, Caja, Boletos y los selectores compartidos. Los registros históricos conservan el ID y su referencia. Reactivar permite seleccionarlo otra vez; si está cerrado o cancelado operativamente, primero debe reabrirse desde su expediente. Los RP se reservan mediante la misma transacción del alta; los RP anteriores quedan reservados para evitar reutilizar referencias históricas. Las ediciones simultáneas requieren la revisión actual.

Los campos de identidad de proyectos gestionados por este catálogo se modifican desde el catálogo. Su presupuesto, planeación y etapas operativas siguen en el expediente de proyecto. No se reinician los proyectos importados del CRM ni sus datos operativos.

## Artículos de almacén

El catálogo editable se encuentra junto al de proyectos. Permite altas, cambios de descripción, categoría, tipo, unidad, marca, modelo y características, así como activar/desactivar. Los cambios alimentan el catálogo central utilizado por Materiales y Compras. Los artículos inactivos se retiran de nuevas selecciones, manteniendo las solicitudes anteriores. Este catálogo describe artículos; no sustituye un inventario físico.

Cada artículo lleva una revisión; una edición obsoleta o simultánea se rechaza en lugar de sobrescribir cambios. La escritura y su bitácora se realizan en una transacción.

## Configurar las cuentas

En **Usuarios, niveles y permisos** se ofrecen las plantillas Procesos (perfil Operaciones) y Director general (perfil Dirección). El administrador puede utilizarlas con cuentas existentes o crear cuentas desde la misma pantalla. Las dos plantillas proponen sólo acceso documental. La plantilla Elaborador documental agrega el permiso para crear documentos; el administrador puede ampliar los permisos necesarios. Para autores sin acceso al panel, habilita Documentos y Elaborar documentos. No se crean credenciales predeterminadas ni se modifica ninguna contraseña existente.

En **Documentos → Configurar revisión y autorización**, el administrador selecciona el usuario de Procesos y el Director General. Deben ser cuentas activas, distintas y con acceso a Documentos. El autorizador requiere perfil Dirección o Administrador. El autor debe ser distinto de ambos responsables. No se permite cambiar responsables con documentos pendientes, ni desactivar o retirar acceso documental a los responsables configurados sin resolver/reasignar su flujo.

## Elaborar, revisar y autorizar

1. El autor elabora y guarda un borrador. El editor conserva imágenes, tablas, redimensionamiento y pantalla completa.
2. Envía a Procesos. El contenido queda bloqueado para edición.
3. Procesos revisa y envía a Dirección General, o devuelve con comentarios obligatorios.
4. Dirección General autoriza y publica, o devuelve con comentarios obligatorios.
5. El autor corrige un documento devuelto y lo reenvía. Siempre vuelve a pasar por Procesos y Dirección General.

Los revisores encuentran sus tareas en **Documentos → Pendientes míos**. Las tareas propias se ordenan primero. Cada transición registra actor, fecha, comentarios y revisión. El servidor verifica la identidad asignada, etapa y revisión, incluso si se invoca directamente la API. Los botones no son la barrera de autorización.

Al modificar un documento vigente, se crea una nueva versión en borrador y se conserva la última versión publicada para los lectores. El borrador sólo es visible para el autor y administración; Procesos lo recibe al enviar y Dirección lo recibe después de la revisión. Los archivos de apoyo siguen la misma política. El historial y las versiones aprobadas se conservan.

## Arquitectura y comprobaciones

Las reglas de documentos se centralizan en `document-flow-server.ts` y `document-policy.ts`; tanto la nueva API como las acciones documentales anteriores usan las mismas reglas, evitando publicación directa. Los catálogos se administran por una API restringida al administrador y alimentan los mismos registros y artículos existentes. Las consultas de Materiales, catálogos y documentos se separan por tipo para evitar cargar cuerpos grandes innecesarios.

La prueba HTTP de MySQL cubre proyectos nuevos, RP duplicados y en carrera, activación, revisiones obsoletas, edición de artículos y cuatro identidades documentales. Comprueba devolución desde ambas etapas, nueva revisión, rechazo de publicación directa, bloqueo de edición pendiente, privacidad y conservación de la última versión publicada. Las pruebas de Chromium cubren formularios de proyectos/artículos, configuración, elaboración, revisión y autorización en 320, 390, 768 y 1440 píxeles, además de los flujos móviles existentes. No equivale a certificar todos los dispositivos físicos; conviene validar los teléfonos de trabajo en vista previa.
