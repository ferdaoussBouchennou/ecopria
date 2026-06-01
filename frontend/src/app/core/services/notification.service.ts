import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = environment.notificationApi;
  private readonly _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this._unreadCount.asObservable();

  constructor(private http: HttpClient) {}

  getAll(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.baseUrl}/${userId}`);
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http
      .get<{ count: number }>(`${this.baseUrl}/${userId}/unread-count`)
      .pipe(
        map(response => response.count),
        tap(count => this._unreadCount.next(count))
      );
  }

  loadUnreadCount(userId: number): void {
    this.getUnreadCount(userId).subscribe();
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, null).pipe(
      tap(() => {
        const current = this._unreadCount.value;
        if (current > 0) {
          this._unreadCount.next(current - 1);
        }
      })
    );
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/read-all`, null).pipe(
      tap(() => this._unreadCount.next(0))
    );
  }
}
