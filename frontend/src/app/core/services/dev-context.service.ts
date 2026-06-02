import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Contexte utilisateur.
 * Utilise désormais l'ID de l'utilisateur connecté via AuthService.
 */
@Injectable({ providedIn: 'root' })
export class DevContextService {
  private auth = inject(AuthService);

  /** authId côté service-utilisateur (profil association) */
  getAssociationAuthId(): number {
    return this.auth.getUserId() || 1;
  }

  /** authId du citoyen (inscriptions, présence, mes-inscriptions) */
  getParticipantUserId(): number {
    return this.auth.getUserId() || 2;
  }

  /** Header X-User-Id pour service-action (user_id dans db_action.associations) */
  getAssociationActionUserId(): number {
    return this.getAssociationAuthId();
  }

  /**
   * userId partenaire pour l'espace partenaire.
   */
  getPartenaireUserId(): number {
    return this.auth.getUserId() || 1;
  }
}
