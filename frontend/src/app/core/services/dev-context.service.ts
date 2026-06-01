import { Injectable } from '@angular/core';

/**
 * Contexte utilisateur en développement (en attendant l'auth JWT).
 * Valeurs modifiables dans la console :
 *   localStorage.setItem('ecopria.dev.associationAuthId', '1')
 *   localStorage.setItem('ecopria.dev.participantUserId', '2')
 */
@Injectable({ providedIn: 'root' })
export class DevContextService {
  private readonly KEY_ASSO        = 'ecopria.dev.associationAuthId';
  private readonly KEY_PARTICIPANT = 'ecopria.dev.participantUserId';
  private readonly KEY_PARTENAIRE  = 'ecopria.dev.partenaireUserId';

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

  /**
   * userId partenaire pour l'espace partenaire.
   * En dev, userId=1 correspond à "Café Botanique" (créé par DemoDataInitializer).
   * Modifier via : localStorage.setItem('ecopria.dev.partenaireUserId', '1')
   */
  getPartenaireUserId(): number {
    return this.readNumber(this.KEY_PARTENAIRE, 1);
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
