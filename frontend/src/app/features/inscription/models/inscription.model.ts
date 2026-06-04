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
  dateInscription: string;
  qrCode?: string;
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
}

export interface MonInscriptionDto {
  inscriptionId: number;
  actionId: number;
  userId: number;
  statut: 'INSCRIT' | 'VALIDE' | 'ABSENT';
  dateAction: string;
  qrCodeUrl?: string;
}

/** Mappé depuis ActionDetailDTO (service-action) */
export interface ActionDTO {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  points: number;
  imageUrl?: string;
  isFixed: boolean;
  /** Champs action non-fixe uniquement */
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
