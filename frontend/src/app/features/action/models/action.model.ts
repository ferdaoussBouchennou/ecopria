export type ActionStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

/** Réponse GET /api/actions — ActionSummaryDto */
export interface ActionSummary {
  id: number;
  title: string;
  categoryName: string;
  categoryImageUrl?: string;
  city: string;
  dateStart: string;
  dateEnd: string;
  points: number;
  /** Points crédités après validation de présence. */
  pointsCredited?: number;
  availablePlaces: number;
  maxParticipants: number;
  registeredCount: number;
  isFixed: boolean;
  status: ActionStatus;
  latitude?: number;
  longitude?: number;
  photoUrls?: string[]; // URLs des photos de l'action
  associationName?: string; // Association name
}

/** Réponse GET /api/actions — ActionSummaryDto (alias) */
export interface ActionSummaryDto extends ActionSummary {}

/** View model for user actions */
export interface ActionRowViewModel {
  inscriptionId: number;
  actionId: number;
  statut: 'INSCRIT' | 'VALIDE' | 'ABSENT';
  dateAction: string;
  title: string;
  categoryName: string;
  categoryImageUrl?: string;
  city: string;
  dateStart: string;
  dateEnd: string;
  points: number;
  availablePlaces: number;
  maxParticipants: number;
  associationName?: string;
  description?: string;
}

/** Réponse GET /api/actions/{id} — ActionDetailDTO */
export interface ActionDetail extends ActionSummary {
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  program: string[];
  practicalInfos: string[];
  photoUrls: string[];
  associationId: number;
  associationName: string;
  associationDescription?: string;
  associationLogoUrl?: string;
  associationCity?: string;
}

/** Réponse GET /api/categories — CategorieDTO */
export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
}

/** GET /api/public/stats — indicateurs agrégés pour l'accueil */
export interface PublicStats {
  actionsRealisees: number;
  participantsInscrits: number;
  actionsEnCours: number;
}

export type ActionSourceFilter = 'all' | 'association' | 'fixed';
export type SortBy = 'date' | 'points' | 'places';

export interface ActionListFilters {
  categoryId?: number;
  categoryName?: string;
  source?: ActionSourceFilter;
  sort?: SortBy;
}
