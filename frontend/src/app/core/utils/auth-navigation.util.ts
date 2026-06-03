import { RegisterRole } from '../models/auth.model';

/** Chemins internes sûrs pour returnUrl (pas de redirect externe). */
export function sanitizeReturnUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//')) {
    return null;
  }
  if (url.startsWith('/connexion') || url.startsWith('/creer-compte')) {
    return null;
  }
  return url;
}

export function defaultHomeForRole(role: RegisterRole | string | null | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ASSOCIATION':
      return '/association';
    case 'PARTNER':
      return '/partenaire';
    case 'USER':
      return '/espace';
    default:
      return '/';
  }
}

const USER_PUBLIC_PREFIXES = [
  '/inscription/',
  '/mes-inscriptions',
  '/action/',
  '/actions',
  '/carte',
  '/accueil',
  '/valider-presence/',
  '/partenaires/',
];

/** Vérifie qu'un returnUrl correspond à l'espace du rôle connecté. */
export function isReturnUrlAllowedForRole(
  url: string,
  role: RegisterRole | string | null | undefined
): boolean {
  if (!role) {
    return false;
  }
  if (url.startsWith('/admin')) {
    return role === 'ADMIN';
  }
  if (url.startsWith('/association')) {
    return role === 'ASSOCIATION';
  }
  if (url.startsWith('/partenaire')) {
    return role === 'PARTNER';
  }
  if (url.startsWith('/espace')) {
    return role === 'USER';
  }
  if (role === 'USER') {
    if (url === '/') {
      return true;
    }
    return USER_PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix));
  }
  return false;
}

export function resolvePostLoginUrl(
  returnUrl: string | null | undefined,
  role: RegisterRole | string
): string {
  const safe = sanitizeReturnUrl(returnUrl);
  if (safe && isReturnUrlAllowedForRole(safe, role)) {
    return safe;
  }
  return defaultHomeForRole(role);
}
