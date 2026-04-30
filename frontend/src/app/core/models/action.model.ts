export interface ActionSummaryDto {
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
  status: string;
  latitude?: number;
  longitude?: number;
  associationName?: string;
}

export interface ActionDetailDto extends ActionSummaryDto {
  description: string;
  address: string;
  program: string[];
  practicalInfos: string[];
  photoUrls: string[];
  associationId?: number;
  associationDescription?: string;
  associationLogoUrl?: string;
  associationCity?: string;
}

export interface MonInscriptionDto {
  inscriptionId: number;
  actionId: number;
  statut: 'INSCRIT' | 'VALIDE' | 'ABSENT';
  dateAction: string;
}

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