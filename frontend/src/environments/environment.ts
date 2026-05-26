/**
 * En dev : ng serve utilise proxy.conf.json → tout passe par l'API Gateway (port 8080).
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
};
