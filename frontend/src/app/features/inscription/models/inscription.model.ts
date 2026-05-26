// Re-export depuis core pour compatibilité avec les imports existants
export type { InscriptionRequest, InscriptionResponse } from '../../../core/models/inscription.model';

// Correspond a ActionDTO.java du service-action (port 9090)
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
