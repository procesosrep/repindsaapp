const hints={
  ER_ACCESS_DENIED_ERROR:'MySQL rechazó la autenticación. Revisa DB_USER y DB_PASSWORD en Secretos del entorno activo.',
  ER_DBACCESS_DENIED_ERROR:'El usuario MySQL no tiene acceso a DB_NAME. Revisa la base asignada a la aplicación.',
  ER_BAD_DB_ERROR:'DB_NAME no corresponde a una base existente en este servidor.',
  ENOTFOUND:'No se pudo resolver DB_HOST. Usa el host que proporciona GoDaddy para esta aplicación.',
  ECONNREFUSED:'El servidor rechazó la conexión. Revisa DB_HOST, DB_PORT y la disponibilidad de MySQL.',
  ETIMEDOUT:'La conexión MySQL agotó su tiempo. Revisa conectividad, DB_HOST y DB_PORT.',
  ER_TABLEACCESS_DENIED_ERROR:'El usuario MySQL no tiene los permisos necesarios sobre las tablas. La instalación requiere CREATE, INDEX, SELECT, INSERT, UPDATE y DELETE.',
  ER_SPECIFIC_ACCESS_DENIED_ERROR:'MySQL rechazó una operación por permisos. Esta versión no necesita SUPER ni crear triggers.',
  ER_BINLOG_CREATE_ROUTINE_NEED_SUPER:'El servidor impide crear triggers por su configuración de binlog. Actualiza la vista previa: esta versión audita desde la aplicación sin crear triggers.',
  EADDRINUSE:'El puerto asignado ya está ocupado. Comprueba que sólo se inicia una instancia con npm start.',
};
export function startupDiagnostics(error,stage) {
  const lines=[`[REPINDSA] Falló el inicio en la etapa: ${stage}.`];
  // Never emit raw driver messages, sql, connection objects or credential values.
  if(stage==='configuración'||/^(Configura |La importación está pendiente\.)/.test(String(error.message||''))) {
    lines.push(String(error.message||'Configuración inválida.'));return lines;
  }
  const raw=String(error.code||'STARTUP_ERROR');
  const code=/^[A-Z0-9_]+$/.test(raw)?raw:'STARTUP_ERROR';
  lines.push(`[REPINDSA] Código: ${code}.`);
  lines.push('[REPINDSA] '+(hints[code]||'Revisa la configuración de esta etapa en README.md.'));
  return lines;
}
