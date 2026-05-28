export interface InscriptionRequest {
  userId: number;
  actionId: number;
  accompagnants?: number;
  motivation?: string;
  conditions?: string;
  imageRights?: boolean;
  newsletter?: boolean;
}

export interface InscriptionResponse {
  id: number;
  userId: number;
  actionId: number;
  dateInscription: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';
  pointsAction: number;
  /** Rempli côté front via service-presence si disponible */
  qrCode?: string;
}
