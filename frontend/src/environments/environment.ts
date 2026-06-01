/**
 * En dev : ng serve utilise proxy.conf.json → API Gateway Docker sur le port 8088.
 */
export const environment = {
  production: false,
  useProxy: true,
  /** Préfixe unique via gateway */
  apiUrl: '/api',
  adminApi: '/admin',
  authApi: '/api/auth',
  userApi: '/api/users',
  notificationApi: '/api/notifications',
  actionApi: '/api',
  inscriptionApi: '/api/inscriptions',
  recompenseApi: '/api/recompenses',
  presenceApi: '/api/presences',
  /** Clés de test Cloudflare Turnstile (toujours valides en local) */
  turnstileSiteKey: '1x00000000000000000000AA',
  /** Si le widget Cloudflare ne charge pas (réseau, bloqueur), case de secours en dev */
  turnstileDevBypass: true,
};
