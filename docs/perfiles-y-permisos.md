# Perfiles, panel y autorizaciones

Los niveles Director y Director general usan el perfil funcional Dirección: acceso a todos los módulos operativos y acciones de creación, consulta y autorización. Configuración, usuarios, niveles, responsables de flujos, disponibilidad y datos legales siguen reservados a Administración. Los catálogos operativos también pueden ser administrados por Dirección.

Los perfiles antiguos de Dirección que sólo permitían consultar documentos se normalizan al leer la sesión, sin restablecer contraseñas ni sustituir cuentas. El panel sincroniza su registro interno con la sesión validada para evitar permisos o roles obsoletos. Los demás perfiles conservan sus permisos configurados; Supervisor puede entrar al panel si se le concede expresamente ese acceso. Un permiso retirado se comprueba nuevamente en cada solicitud.

El acceso operativo no elimina validaciones: las autorizaciones conservan la etapa, las cantidades, las revisiones y los responsables asignados. No se permite autorizar solicitudes propias. El flujo documental sigue pasando por Procesos y por el Director General asignado, sin saltar etapas. Almacén solicita compras, Compras las atiende, Almacén recibe físicamente y el solicitante confirma su entrega.

Verificación: pruebas de política por nivel, flujos existentes, escenarios HTTP sobre MySQL aislado con perfiles antiguos y permisos revocados, y navegación del panel a 375 y 1440 px. Los cambios de permisos realizados desde Configuración cierran las sesiones según el comportamiento existente; el usuario debe iniciar sesión nuevamente.
