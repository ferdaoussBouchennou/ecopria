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
