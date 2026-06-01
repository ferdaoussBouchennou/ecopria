import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue.'
): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Serveur injoignable. Démarrez Docker ou l’API Gateway (port 8088).';
    }
    if (error.status === 403) {
      return extractBody(error) || 'Accès refusé. Réessayez dans une minute ou reconnectez-vous.';
    }
    if (error.status === 429) {
      return extractBody(error) || 'Veuillez patienter avant de renvoyer un code.';
    }
    if (error.status === 404) {
      return extractBody(error) || 'Ressource introuvable.';
    }
    if (error.status === 409) {
      return extractBody(error) || 'Conflit : opération déjà effectuée.';
    }
    if (error.status === 405) {
      return 'Requête refusée par le serveur web. Reconstruisez le conteneur frontend ou utilisez npm start en dev.';
    }
    if (error.status >= 500) {
      return extractBody(error) || 'Erreur serveur.';
    }
    return extractBody(error) || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function extractBody(error: HttpErrorResponse): string | null {
  const body = error.error;
  if (typeof body === 'string' && body.trim()) {
    const text = body.replace(/^Error:\s*/i, '').trim();
    if (text.startsWith('<') && text.includes('</html>')) {
      return null;
    }
    return text;
  }
  if (body && typeof body === 'object') {
    const msg = (body as { message?: string; erreur?: string }).message
      ?? (body as { erreur?: string }).erreur;
    if (msg) {
      return String(msg);
    }
  }
  return null;
}
