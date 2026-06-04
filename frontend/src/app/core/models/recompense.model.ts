export type RecompenseType = 'STOCK' | 'REDUCTION' | 'SERVICE' | 'EXPERIENCE';
export type CouponStatus = 'DISTRIBUE' | 'UTILISE' | 'EXPIRE';

export interface MystereBoxItem {
  id?: number;
  titre: string;
  description?: string;
  probabilite: number;
}

export interface RecompenseItemDto {
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

export interface CouponDto {
  id: number;
  userId?: number;
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

export interface CouponViewModel extends CouponDto {
  qrCodeUrl?: string;
  isExpired: boolean;
}

export interface DashboardPartenaire {
  partenaireName: string;
  vuesProfil?: number;
  clicsOffres?: number;
  tauxClic?: number;
  noteMoyenne?: number;
  nombreAvis?: number;
  badgeActuel?: string;
  couponsDistribues: number;
  couponsUtilises: number;
  tauxUtilisation: number;
  commissionsARegler: number;
  commissionRate?: number;  // Taux de commission du partenaire (ex: 15 pour 15%)
  offresActives: RecompenseItemDto[];
  echangesRecents: CouponDto[];
}

export interface PartenaireProfil {
  userId: number;
  name: string;
  category?: string;
  address?: string;
  city?: string;
  description?: string;
  imageUrl?: string;
  galleryImages?: string[];
  phone?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  openingHours?: string;
}

export interface UpdatePartenaireProfil {
  name?: string;
  category?: string;
  address?: string;
  city?: string;
  description?: string;
  imageUrl?: string;
  galleryImages?: string[];
  phone?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  openingHours?: string;
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
  coupon: CouponDto;
}

export interface EchangerRecompenseDto {
  recompenseId: number;
}
