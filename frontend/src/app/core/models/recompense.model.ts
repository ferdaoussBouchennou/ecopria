export type RecompenseType = 'STOCK' | 'REDUCTION' | 'SERVICE' | 'EXPERIENCE';
export type CouponStatus = 'DISTRIBUE' | 'UTILISE' | 'EXPIRE';

export interface MystereBoxItem {
  id?: number;
  titre: string;
  description?: string;
  probabilite: number;
}

export interface Recompense {
  id: number;
  partenaireId: number;
  partenaireName: string;
  partenaireCategory?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  pointsNecessaires: number;
  type: RecompenseType;
  stock?: number;
  discountPercentage?: number;
  valeurDh?: number;
  dateExpiration?: string;
  isAvailable: boolean;
  isActive: boolean;
  hasMystereBox?: boolean;
  mystereBoxPoints?: number;
  mystereBoxItems?: MystereBoxItem[];
  couponsUtilises?: number;
  couponsDistribues?: number;
}

export interface CreateRecompenseRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  pointsNecessaires: number;
  type: RecompenseType;
  stock?: number;
  discountPercentage?: number;
  valeurDh?: number;
  dateExpiration?: string;
  hasMystereBox?: boolean;
  mystereBoxPoints?: number;
  mystereBoxItems?: MystereBoxItem[];
}

export interface Coupon {
  id: number;
  code: string;
  recompenseTitle: string;
  recompenseImageUrl?: string;
  partenaireName: string;
  pointsUtilises: number;
  status: CouponStatus;
  expireLe?: string;
  valideLe?: string;
  createdAt?: string;
}

export interface DashboardPartenaire {
  partenaireName: string;
  vuesProfilPublic?: number;
  clicsVersOffres?: number;
  couponsDistribues: number;
  couponsUtilises: number;
  tauxUtilisation: number;
  noteMoyenne?: number;
  nombreAvis?: number;
  commissionsARegler: number;
  badgeActuel?: string;
  offresActives: Recompense[];
  echangesRecents: Coupon[];
}

export interface PartenaireProfil {
  userId: number;
  name: string;
  category?: string;
  address?: string;
  city?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdatePartenaireProfil {
  name?: string;
  category?: string;
  address?: string;
  city?: string;
  description?: string;
  imageUrl?: string;
}

export interface AvisPartenaire {
  id: number;
  authorName: string;
  rating: number;
  comment?: string;
  reponse?: string;
  createdAt?: string;
}

export interface BadgeProgression {
  nom: string;
  seuil: number;
  actuel: number;
  pourcentage: number;
  atteint: boolean;
}

export interface VisibilitePartenaire {
  vuesProfil: number;
  clicsOffres: number;
  tauxClic: number;
  noteMoyenne?: number;
  nombreAvis: number;
  couponsDistribues: number;
  couponsUtilises: number;
  tauxConversion: number;
  badgeActuel: string;
  progressionBadges: BadgeProgression[];
}

export interface CommissionMensuelle {
  mois: string;
  couponsUtilises: number;
  caGenere: number;
  commission: number;
}

export interface ResultatMystereBox {
  titrePrix: string;
  descriptionPrix?: string;
  probabilite: number;
  coupon: Coupon;
}
