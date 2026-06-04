export interface Profile {
  id: number;
  authId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  totalPoints: number;
  trustScore: number;
  photo?: string;
  createdAt: string;
}

export interface PointHistory {
  id: number;
  citizenId: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  source?: string;
  createdAt: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  requiredPoints: number;
}

export interface UserBadge {
  id: number;
  badge: Badge;
  obtainedAt: string;
}

export interface BadgeStatus {
  id: number;
  name: string;
  description: string;
  icon: string;
  requiredPoints: number;
  obtained: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  lastName: string;
  firstName: string;
  city?: string;
  totalPoints: number;
  isMe: boolean;
}

export interface UpcomingAction {
  id: number;
  title: string;
  location: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  points: number;
  imageUrl?: string;
}

export interface NotificationPreferences {
  nearbyActions: boolean;
  reminders: boolean;
  catalogNews: boolean;
  newsletter: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  photo?: string;
  authId?: number;
}

export interface UpdatePreferencesRequest {
  nearbyActions?: boolean;
  reminders?: boolean;
  catalogNews?: boolean;
  newsletter?: boolean;
}
