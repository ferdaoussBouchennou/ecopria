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
  id?: number;
  authId?: number;
  name?: string;
  nom?: string;
  email?: string;
  createdAt?: string;
}

export interface AdminConfiguration {
  id: number;
  cle: string;
  valeur: string;
  description?: string;
  updatedAt?: string;
}

export type AdminNavId =
  | 'vue-globale'
  | 'comptes'
  | 'fraude'
  | 'actions-fixes'
  | 'support'
  | 'moderation'
  | 'categories';
