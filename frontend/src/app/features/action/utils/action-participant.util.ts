import { ActionStatus, ActionSummary } from '../models/action.model';

export type InscriptionBackendStatut = 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';
export type ParticipationStatut = 'INSCRIT' | 'VALIDE' | 'ABSENT';

/** Action désactivée ou non publiée — à masquer dans l'espace participant et le catalogue public. */
export function isDisabledAction(status: ActionStatus | string | undefined): boolean {
  return status === 'CANCELLED' || status === 'DRAFT';
}

/** Action encore à venir (date de fin non dépassée). */
export function isActionUpcoming(action: Pick<ActionSummary, 'dateEnd' | 'status'>): boolean {
  if (isDisabledAction(action.status)) {
    return false;
  }
  if (!action.dateEnd) {
    return true;
  }
  return new Date(action.dateEnd).getTime() >= Date.now();
}

/** Inscription annulée ou action désactivée — ne pas afficher dans l'espace participant. */
export function shouldHideParticipantEntry(
  inscriptionStatut: InscriptionBackendStatut,
  action?: Pick<ActionSummary, 'status'>
): boolean {
  if (inscriptionStatut === 'ANNULEE') {
    return true;
  }
  return action != null && isDisabledAction(action.status);
}

/** Statut d'affichage pour « Mes actions » à partir de l'inscription et de l'action. */
export function resolveParticipationStatut(
  inscriptionStatut: InscriptionBackendStatut,
  action: Pick<ActionSummary, 'dateEnd' | 'status'>
): ParticipationStatut {
  if (inscriptionStatut === 'ANNULEE' || isDisabledAction(action.status)) {
    return 'ABSENT';
  }

  if (isActionUpcoming(action)) {
    return 'INSCRIT';
  }

  return action.status === 'COMPLETED' ? 'VALIDE' : 'ABSENT';
}
