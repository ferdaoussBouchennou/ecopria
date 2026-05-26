import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue.'
): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Serveur injoignable. Démarrez l’API Gateway (8080) et le microservice concerné.';
    }
    if (error.status === 404) {
      return extractBody(error) || 'Ressource introuvable.';
    }
    if (error.status === 409) {
      return extractBody(error) || 'Conflit : opération déjà effectuée.';
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
    return body.replace(/^Error:\s*/i, '').trim();
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
