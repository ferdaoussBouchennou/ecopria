import { environment } from '../../../environments/environment';

/** Préfixe API : relatif (/api/…) via nginx ou gateway, ou absolu si useProxy=false en dev. */
export function apiPath(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  if (environment.useProxy || !environment.gatewayUrl) {
    return path;
  }
  return `${environment.gatewayUrl.replace(/\/$/, '')}${path}`;
}
