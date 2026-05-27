export type ActionStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

/** Réponse GET /api/actions — ActionSummaryDTO */
export interface ActionSummary {
  id: number;
  title: string;
  categoryName: string;
  categoryImageUrl?: string;
  city: string;
  dateStart: string;
  dateEnd: string;
  points: number;
  availablePlaces: number;
  maxParticipants: number;
  registeredCount: number;
  isFixed: boolean;
  status: ActionStatus;
  latitude?: number;
  longitude?: number;
  photoUrls?: string[]; // URLs des photos de l'action
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

export type ActionSourceFilter = 'all' | 'association' | 'fixed';
export type SortBy = 'date' | 'points' | 'places';

export interface ActionListFilters {
  categoryId?: number;
  categoryName?: string;
  source?: ActionSourceFilter;
  sort?: SortBy;
}
