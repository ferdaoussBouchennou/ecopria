export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  pendingValidations: number;
  pendingAssociations: number;
  pendingPartenaires: number;
  openFraudAlerts: number;
  supportTickets: number;
  commissionRevenue: number;
  totalActions: number;
  activeActions: number;
  totalInscriptions: number;
  totalRewardsExchanged: number;
  totalPointsDistributed: number;
  commissionRate: number;
  activityLast30Days: number[];
  pendingRequests: PendingRequestItem[];
  recentLogs: AdminLog[];
}

export interface PendingRequestItem {
  userId: number;
  label: string;
  role: string;
  createdAt?: string;
}

export interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  cibleId: number;
  cibleType: string;
  createdAt: string;
}

export interface AdminPendingAccount {
  userId?: number;
  id?: number;
  authId?: number;
  role?: string;
  name?: string;
  nom?: string;
  email?: string;
  createdAt?: string;
}

export type AccountValidationFilter = 'pending' | 'approved' | 'rejected' | 'all';

export interface CitizenAccountItem {
  userId: number;
  firstName?: string;
  lastName?: string;
  email: string;
  city?: string;
  totalPoints?: number;
  trustScore?: number;
  createdAt?: string;
  isActive?: boolean;
  status: 'Actif' | 'Désactivé';
}

export interface AccountValidationItem {
  userId: number;
  name: string;
  email: string;
  role: 'ASSOCIATION' | 'PARTNER';
  createdAt?: string;
  status: 'En attente' | 'Validé' | 'Rejeté';
  isActive?: boolean;
  documentPath?: string;
  hasStoredDocument?: boolean;
  rejectionReason?: string;
}

export interface UtilisateurCitizenProfile {
  id?: number;
  authId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  photo?: string;
  totalPoints?: number;
  trustScore?: number;
  level?: number;
  createdAt?: string;
}

export interface UtilisateurAssociationProfile {
  id?: number;
  authId?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  logo?: string;
  createdAt?: string;
}

export interface UtilisateurPartnerProfile {
  id?: number;
  authId?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  category?: string;
  description?: string;
  logo?: string;
  createdAt?: string;
}

export interface AccountValidationsPage {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  items: AccountValidationItem[];
}

export interface AdminConfiguration {
  id: number;
  cle: string;
  valeur: string;
  description?: string;
  updatedAt?: string;
}

export interface ActionFixe {
  id: number;
  titre: string;
  description?: string;
  categorie: string;
  estFixe?: boolean;
  points: number;
  active?: boolean;
  updatedAt?: string;
}

export interface ActionFixeRequest {
  titre: string;
  description?: string;
  categorie: string;
  points: number;
  frequence?: string;
}

export interface ActionAssociationRequest {
  titre: string;
  description?: string;
  categorie: string;
  associationId: number;
  associationName?: string;
  latitude: number;
  longitude: number;
  points: number;
  placesTotal?: number;
  lieu?: string;
  address?: string;
  city?: string;
  dateStart?: string;
  dateEnd?: string;
  program?: string[];
  practicalInfos?: string[];
}

export interface ActionNonFixeDetail {
  id: number;
  title: string;
  description?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  dateStart?: string;
  dateEnd?: string;
  points?: number;
  maxParticipants?: number;
  availablePlaces?: number;
  program?: string[];
  practicalInfos?: string[];
  photoUrls?: string[];
  associationId?: number;
  associationName?: string;
  status?: string;
}

export interface ActionAssociationOption {
  id: number;
  userId: number;
  name: string;
  city?: string;
  validated?: boolean;
}

export interface ActionNonFixe {
  id: number;
  title: string;
  categoryName?: string;
  points: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isFixed?: boolean;
  city?: string;
  associationName?: string;
  dateStart?: string;
  dateEnd?: string;
  maxParticipants?: number;
  availablePlaces?: number;
}

export interface AdminCategorie {
  id: number;
  nom: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
  updatedAt?: string;
}

export type ModerationActionStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export type ModerationFilter = 'all' | 'draft' | 'published' | 'suspended' | 'completed';

export interface ModerationAction {
  id: number;
  title: string;
  categoryName?: string;
  categoryImageUrl?: string;
  city?: string;
  dateStart?: string;
  dateEnd?: string;
  points?: number;
  availablePlaces?: number;
  maxParticipants?: number;
  registeredCount?: number;
  isFixed?: boolean;
  status?: ModerationActionStatus;
  associationName?: string;
  photoUrls?: string[];
}

export interface AdminAssociationProfile {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  logoUrl?: string;
  validated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  temporaryPassword?: string;
}

export interface AdminAssociationProfileRequest {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  logoUrl?: string;
  validated?: boolean;
}

export interface AdminCategorieRequest {
  nom: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
}

export interface ActionDbCategory {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
  actionCount: number;
}

export interface CategoryLinkedAction {
  id: number;
  title: string;
  status?: string;
  city?: string;
  associationName?: string;
  isFixed?: boolean;
}

export interface CategoryDeletePreview {
  id: number;
  nom: string;
  actionCount: number;
  linkedActions: CategoryLinkedAction[];
}

/** Unified card for admin + db_action categories on one page */
export interface CategoryCardView {
  key: string;
  name: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
  actionCount: number;
  adminItem: AdminCategorie | null;
  actionDbId?: number;
}

export type AdminUserRole = 'USER' | 'ASSOCIATION' | 'PARTNER' | 'ADMIN';

export type AdminUserStatusFilter = 'all' | 'active' | 'banned' | 'unverified';

export interface AdminUser {
  userId: number;
  email: string;
  role: AdminUserRole | string;
  isActive?: boolean;
  isVerified?: boolean;
  displayName?: string;
  createdAt?: string;
}

export interface AdminUsersQuery {
  email?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface AdminUserActionResult {
  emailSent: boolean;
  message: string;
}

export type AdminNavId =
  | 'vue-globale'
  | 'comptes'
  | 'fraude'
  | 'actions-fixes'
  | 'support'
  | 'moderation'
  | 'categories';
