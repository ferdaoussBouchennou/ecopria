import { Injectable } from '@angular/core';

/**
 * Contexte utilisateur en développement (en attendant l'auth JWT).
 * Valeurs modifiables dans la console :
 *   localStorage.setItem('ecopria.dev.associationAuthId', '1')
 *   localStorage.setItem('ecopria.dev.participantUserId', '2')
 */
@Injectable({ providedIn: 'root' })
export class DevContextService {
  private readonly KEY_ASSO = 'ecopria.dev.associationAuthId';
  private readonly KEY_PARTICIPANT = 'ecopria.dev.participantUserId';

  /** authId côté service-utilisateur (profil association) */
  getAssociationAuthId(): number {
    return this.readNumber(this.KEY_ASSO, 1);
  }

  /** authId du citoyen (inscriptions, présence, mes-inscriptions) */
  getParticipantUserId(): number {
    return this.readNumber(this.KEY_PARTICIPANT, 2);
  }

  /** Header X-User-Id pour service-action (user_id dans db_action.associations) */
  getAssociationActionUserId(): number {
    return this.getAssociationAuthId();
  }

  private readNumber(key: string, defaultValue: number): number {
    if (typeof localStorage === 'undefined') {
      return defaultValue;
    }
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') {
      return defaultValue;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
  }
}
