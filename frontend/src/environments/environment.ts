/**
 * Architecture réseau Ecopria
 * ───────────────────────────
 * Frontend → API Gateway (port 8080) → microservices (ex. service-recompense :9093)
 *
 * En production (Docker) : nginx sert l'Angular et proxy /api, /admin, /uploads vers le gateway.
 * En dev (ng serve) : proxy.conf.json fait la même chose (redirection vers le gateway local).
 * Le proxy Angular n'est PAS un backend alternatif — il évite seulement les soucis CORS en local.
 */
export const environment = {
  production: false,
  /** true = ng serve utilise proxy.conf.json → gateway ; false = URLs absolues vers gatewayUrl */
  useProxy: true,
  /** API Gateway — utilisé si useProxy === false */
  gatewayUrl: 'http://localhost:8080',
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
  /** Clés de test Cloudflare Turnstile (toujours valides en local) */
  turnstileSiteKey: '0x4AAAAAADe8ehqxyMsnM1-d',
  /** Si le widget Cloudflare ne charge pas (réseau, bloqueur), case de secours en dev */
  turnstileDevBypass: true,
};
