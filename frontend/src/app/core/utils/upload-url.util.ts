import { environment } from '../../../environments/environment';

/**
 * Normalise une URL de fichier uploadé pour l'affichage dans le navigateur.
 * Les photos citoyens passent par /api/users/uploads/... (routé par la gateway).
 */
export function resolveUploadUrl(url: string | undefined | null): string | undefined {
  if (url == null || !url.trim()) {
    return undefined;
  }

  const trimmed = url.trim();

  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/users/uploads/citizens/')) {
    return trimmed;
  }

  const citizensMatch = trimmed.match(/\/uploads\/citizens\/([^/?#]+)/i);
  if (citizensMatch) {
    return `${environment.userApi}/uploads/citizens/${citizensMatch[1]}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  return '/' + trimmed.replace(/^\/+/, '');
}
