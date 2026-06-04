import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Identifiants utilisateur pour les appels API (authId / userId).
 * N'utilise plus de fallbacks dev : l'utilisateur doit être connecté.
 */
@Injectable({ providedIn: 'root' })
export class DevContextService {
  private auth = inject(AuthService);

  /** authId côté service-utilisateur (profil association). */
  getAssociationAuthId(): number {
    return this.auth.requireUserId();
  }

  /** authId du citoyen (inscriptions, présence, espace). */
  getParticipantUserId(): number {
    return this.auth.requireUserId();
  }

  /** Header X-User-Id pour service-action. */
  getAssociationActionUserId(): number {
    return this.getAssociationAuthId();
  }

  /** userId partenaire pour l'espace partenaire. */
  getPartenaireUserId(): number {
    return this.auth.requireUserId();
  }
}
