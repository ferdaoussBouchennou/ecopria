import { CategoryMeta, CATEGORY_META } from '../action/constants/category-meta';
import { SITE_IMAGES } from '../../core/constants/site-images';
import { ActionSummary } from '../action/models/action.model';

export interface AccueilCategoryCard {
  name: string;
  meta: CategoryMeta;
  imageUrl: string;
}

export const ACCUEIL_CATEGORY_CARDS: AccueilCategoryCard[] = [
  {
    name: 'Nettoyage',
    meta: CATEGORY_META['Nettoyage'],
    imageUrl: SITE_IMAGES.categories.nettoyage,
  },
  {
    name: 'Reboisement',
    meta: CATEGORY_META['Reboisement'],
    imageUrl: SITE_IMAGES.categories.reboisement,
  },
  {
    name: 'Sensibilisation',
    meta: CATEGORY_META['Sensibilisation'],
    imageUrl: SITE_IMAGES.categories.sensibilisation,
  },
  {
    name: 'Recyclage',
    meta: CATEGORY_META['Recyclage'],
    imageUrl: SITE_IMAGES.categories.recyclage,
  },
  {
    name: 'Compostage',
    meta: CATEGORY_META['Compostage'],
    imageUrl: SITE_IMAGES.categories.compostage,
  },
];

export const ACCUEIL_STATS = [
  { value: '1 240', label: 'Actions menées' },
  { value: '38 ha', label: 'Reboisés' },
  { value: '86 t', label: 'Déchets collectés' },
] as const;

/** Visuels distincts pour les 3 cartes « À l'affiche » (index 0–2) */
export const ACCUEIL_FEATURED_IMAGES = SITE_IMAGES.eventAffiche;

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
    title: 'Ramassage de déchets dans la forêt de Bouhachem',
    categoryName: 'Nettoyage',
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
    title: 'Nettoyage des berges de l’oued Martil',
    categoryName: 'Nettoyage',
    city: 'Martil',
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
