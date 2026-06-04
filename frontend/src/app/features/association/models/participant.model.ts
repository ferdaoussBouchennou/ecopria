// Modèle pour un participant avec ses détails complets
export interface Participant {
  inscriptionId: number;
  userId: number;
  actionId: number;
  dateInscription: string;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';
  pointsAction: number;
  presenceValidee?: boolean;
  pointsGagnes?: number | null;
  trustScore?: number;
  enAttenteMotif?: 'PLACES_COMPLETES' | 'TRUST_SCORE';
  // Détails utilisateur (à récupérer séparément)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  city?: string;
  motivation?: string;
  conditions?: string;
  imageRights?: boolean;
  newsletter?: boolean;
}

// Statistiques des participants
export interface ParticipantsStats {
  total: number;
  confirmes: number;
  enAttente: number;
  annules: number;
  presencesValidees: number;
  pointsAttribues: number;
}

// Filtres disponibles
export type StatutFilter = 'TOUS' | 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE';

// Colonnes triables
export type SortColumn = 'nom' | 'dateInscription' | 'statut';
export type SortDirection = 'asc' | 'desc';
