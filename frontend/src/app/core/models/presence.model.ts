export interface PresenceResponse {
  id: number;
  userId: number;
  actionId: number;
  points: number;
  dateValidation: string;
  statut: string;
}

export interface QrCodeActionResponse {
  actionId: number;
  qrCode: string;
}

export type PresenceStatus =
  | 'VALIDE'
  | 'DEJA_VALIDE'
  | 'QR_INVALIDE'
  | 'GPS_HORS_ZONE'
  | 'FRAUDE_DETECTEE'
  | 'ERREUR';

export interface PresenceValidationResult {
  status: PresenceStatus;
  message: string;
  userId?: number;
  actionId?: number;
  pointsCredites?: number;
  distanceMetres?: number;
  tentativesEchouees?: number;
}

export interface ParticipantRow {
  inscriptionId: number;
  userId: number;
  statut: string;
  dateInscription: string;
  pointsAction: number;
}
