// Correspond exactement à InscriptionRequestDTO.java du backend
export interface InscriptionRequest {
  userId: number;
  actionId: number;
}

// Correspond exactement à InscriptionResponseDTO.java du backend
export interface InscriptionResponse {
  id: number;
  userId: number;
  actionId: number;
  dateInscription: string;        // LocalDateTime serialise en ISO string
  qrCode: string;                 // ex: INS-1-42-A3F9B2C1
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';
  pointsAction: number;
}
export type { InscriptionRequest, InscriptionResponse } from '../../../core/models/inscription.model';

// Correspond a ActionDTO.java du service-action (port 8083)
export interface ActionDTO {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  points: number;
  imageUrl?: string;
  isFixed: boolean;
  /** Champs association uniquement */
  lieu?: string;
  ville?: string;
  dateAction?: string;
  heureDebut?: string;
  heureFin?: string;
  placesDisponibles?: number;
  placesTotal?: number;
  inscrits?: number;
  associationId?: number;
  associationName?: string;
  associationCity?: string;
  associationLogoUrl?: string;
  practicalInfos?: string[];
}
