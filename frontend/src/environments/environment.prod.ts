/**
 * Production : nginx → API Gateway → microservices (pas de proxy Angular).
 */
export const environment = {
  production: true,
  useProxy: false,
  gatewayUrl: '',
  apiUrl: '/api',
  partenaireApi: '/api/partenaire',
  uploadsUrl: '/uploads',
  adminApi: '/admin',
  authApi: '/api/auth',
  userApi: '/api/users',
  notificationApi: '/api/notifications',
  actionApi: '/api',
  inscriptionApi: '/api/inscriptions',
  recompenseApi: '/api/recompenses',
  presenceApi: '/api/presences',
  turnstileSiteKey: '1x00000000000000000000AA',
  turnstileDevBypass: true,
};
