export interface Profile {
  id: number;
  userId: number;
  lastName: string;
  firstName: string;
  photo?: string;
  city?: string;
  totalPoints: number;
  level: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  lastName: string;
  firstName: string;
  city: string;
  totalPoints: number;
  isMe: boolean;
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
}

export interface RewardItem {
  id: number;
  title: string;
  partner: string;
  pointsCost: number;
  description: string;
}

export interface PointHistory {
  id: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  source: string;
  description: string;
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

export interface UpcomingAction {
  id: number;
  title: string;
  location: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  points: number;
  imageUrl: string;
}