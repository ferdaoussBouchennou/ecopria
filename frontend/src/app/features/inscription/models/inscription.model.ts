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

// Correspond a ActionDTO.java du service-action (port 8083)
export interface ActionDTO {
  id: number;
  titre: string;
  description: string;
  lieu: string;
  dateAction: string;
  heureDebut: string;
  heureFin: string;
  categorie: string;
  placesDisponibles: number;
  placesTotal: number;
  points: number;
  imageUrl?: string;
}
