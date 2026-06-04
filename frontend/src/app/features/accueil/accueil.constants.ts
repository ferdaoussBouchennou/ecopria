import { ActionSummary } from '../action/models/action.model';

export interface AccueilStatItem {
  value: string;
  label: string;
}

/** Données de démonstration si l’API ne renvoie pas encore d’actions publiées */
export const ACCUEIL_FEATURED_DEMO: ActionSummary[] = [
  {
    id: 0,
    title: 'Grande journée de nettoyage de la plage de Martil',
    categoryName: 'Nettoyage',
    city: 'Martil',
    dateStart: '2025-05-24T09:00:00',
    dateEnd: '2025-05-24T13:00:00',
    points: 120,
    availablePlaces: 33,
    maxParticipants: 50,
    registeredCount: 17,
    isFixed: false,
    status: 'PUBLISHED',
  },
  {
    id: 0,
    title: 'Plantation de 200 chênes, forêt de Bouhachem',
    categoryName: 'Reboisement',
    city: 'Bouhachem',
    dateStart: '2025-06-01T10:00:00',
    dateEnd: '2025-06-01T15:00:00',
    points: 130,
    availablePlaces: 28,
    maxParticipants: 40,
    registeredCount: 12,
    isFixed: false,
    status: 'PUBLISHED',
  },
  {
    id: 0,
    title: 'Atelier sensibilisation éco-citoyenne',
    categoryName: 'Sensibilisation',
    city: 'Tanger',
    dateStart: '2025-06-07T09:30:00',
    dateEnd: '2025-06-07T12:30:00',
    points: 110,
    availablePlaces: 22,
    maxParticipants: 35,
    registeredCount: 13,
    isFixed: false,
    status: 'PUBLISHED',
  },
];
