export type NotificationType = 'INFO' | 'SUCCESS' | 'ALERT';

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
