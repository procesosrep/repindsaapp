export function serverConfig(env, dev) {
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }
  if (!dev && !env.APP_ORIGIN) {
    throw new Error('Define APP_ORIGIN con la URL HTTPS pública.');
  }
  const origin = new URL(env.APP_ORIGIN || `http://localhost:${port}`);
  if ((!dev && origin.protocol !== 'https:') ||
      !['http:', 'https:'].includes(origin.protocol) ||
      origin.username || origin.password || origin.pathname !== '/' ||
      origin.search || origin.hash) {
    throw new Error('APP_ORIGIN debe ser el origen público exacto, HTTPS en producción, sin rutas ni credenciales.');
  }
  return {port, origin};
}
