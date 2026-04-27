import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = 'http://localhost:8085/api/notifications';
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getAll(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.baseUrl}/${userId}`);
  }

  loadUnreadCount(userId: number): void {
    this.http.get<{ count: number }>(`${this.baseUrl}/${userId}/unread-count`)
      .subscribe((response) => {
        this.unreadCountSubject.next(response.count);
      });
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      tap(() => this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1)))
    );
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }
}