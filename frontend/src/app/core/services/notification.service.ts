import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = environment.notificationApi;

  constructor(private http: HttpClient) {}

  getAll(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.baseUrl}/${userId}`);
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http
      .get<{ count: number }>(`${this.baseUrl}/${userId}/unread-count`)
      .pipe(map(response => response.count));
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, null);
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/read-all`, null);
  }
}
