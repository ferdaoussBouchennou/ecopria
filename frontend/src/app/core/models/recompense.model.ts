export interface RecompenseItemDto {
  id: number;
  partenaireId: number;
  partenaireName: string;
  partenaireCategory: string;
  title: string;
  description: string;
  imageUrl: string;
  pointsNecessaires: number;
  type: 'STOCK' | 'REDUCTION' | 'SERVICE' | 'EXPERIENCE';
  stock?: number | null;
  discountPercentage?: number | null;
  valeurDh?: number | null;
  dateExpiration?: string | null;
  isAvailable: boolean;
  isActive: boolean;
}

export interface CouponDto {
  id: number;
  code: string;
  recompenseTitle: string;
  recompenseImageUrl?: string;
  partenaireName: string;
  pointsUtilises: number;
  status: 'DISTRIBUE' | 'UTILISE' | 'EXPIRE' | string;
  expireLe: string;
  valideLe?: string | null;
  createdAt: string;
}

export interface CouponViewModel extends CouponDto {
  isExpired: boolean;
  qrCodeUrl?: string;
}