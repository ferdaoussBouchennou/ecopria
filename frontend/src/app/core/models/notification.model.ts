export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}