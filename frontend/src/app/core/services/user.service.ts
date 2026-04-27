import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { 
  Profile, LeaderboardEntry, NotificationPreferences, UpdateProfileRequest,
  PointHistory, UserBadge, UpcomingAction
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) { }

  getProfile(userId: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${userId}`);
  }

  updateProfile(userId: number, request: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${userId}`, request);
  }

  getLeaderboard(userId: number): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard?userId=${userId}`);
  }

  getPreferences(userId: number): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/${userId}/preferences`);
  }

  updatePreferences(userId: number, prefs: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.baseUrl}/${userId}/preferences`, prefs);
  }

  getHistory(userId: number): Observable<PointHistory[]> {
    return this.http.get<PointHistory[]>(`${this.baseUrl}/${userId}/history`);
  }

  getBadges(userId: number): Observable<UserBadge[]> {
    return this.http.get<UserBadge[]>(`${this.baseUrl}/${userId}/badges`);
  }

  // Dynamic Upcoming Actions (Mocked for now)
  getUpcomingActions(): Observable<UpcomingAction[]> {
    const mockActions: UpcomingAction[] = [
      {
        id: 1,
        title: 'Grande journée de nettoyage de la plage de Martil',
        location: 'MARTIL',
        category: 'NETTOYAGE',
        date: 'Sam. 24 mai 2025',
        startTime: '09:00',
        endTime: '13:00',
        points: 120,
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fbe5e?q=80&w=200&auto=format&fit=crop'
      },
      {
        id: 2,
        title: 'Ramassage de déchets dans la forêt de Bouhachem',
        location: 'BOUHACHEM',
        category: 'NETTOYAGE',
        date: 'Dim. 1 juin 2025',
        startTime: '10:00',
        endTime: '15:00',
        points: 130,
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=200&auto=format&fit=crop'
      }
    ];
    return of(mockActions);
  }
}