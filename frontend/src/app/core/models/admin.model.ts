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

export interface AccountValidationItem {
  userId: number;
  name: string;
  email: string;
  role: 'ASSOCIATION' | 'PARTNER';
  createdAt?: string;
  status: 'En attente' | 'Validé' | 'Rejeté';
  documentPath?: string;
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
}

export interface ActionNonFixe {
  id: number;
  title: string;
  categoryName?: string;
  points: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isFixed?: boolean;
  city?: string;
}

export interface AdminCategorie {
  id: number;
  nom: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
  updatedAt?: string;
}

export interface AdminCategorieRequest {
  nom: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
}

export type AdminNavId =
  | 'vue-globale'
  | 'comptes'
  | 'fraude'
  | 'actions-fixes'
  | 'support'
  | 'moderation'
  | 'categories';
