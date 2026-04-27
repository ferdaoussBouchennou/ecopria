import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Profile, LeaderboardEntry, NotificationPreferences, UpdateProfileRequest,
  PointHistory, UserBadge
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = `${environment.api.user}/api/users`;

  constructor(private http: HttpClient) { }

  getProfile(userId: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${userId}/profile`);
  }

  updateProfile(userId: number, request: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${userId}/profile`, request);
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
}