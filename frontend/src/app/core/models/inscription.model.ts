export interface InscriptionRequest {
  userId: number;
  actionId: number;
  motivation?: string;
  conditions?: string;
  imageRights?: boolean;
  newsletter?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
}

export interface InscriptionResponse {
  id: number;
  userId: number;
  actionId: number;
  dateInscription: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';
  pointsAction: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  photoUrl?: string;
  motivation?: string;
  conditions?: string;
  imageRights?: boolean;
  newsletter?: boolean;
  trustScore?: number;
  enAttenteMotif?: 'PLACES_COMPLETES' | 'TRUST_SCORE';
  /** Rempli côté front via service-presence si disponible */
  qrCode?: string;
}
