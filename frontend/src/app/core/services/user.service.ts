import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../utils/http-error.util';
import {
  Profile,
  PointHistory,
  UserBadge,
  LeaderboardEntry,
  NotificationPreferences,
  UpdateProfileRequest,
  UpdatePreferencesRequest
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.userApi;

  constructor(private http: HttpClient) {}

  getProfile(id: number): Observable<Profile> {
    return this.http
      .get<Profile>(`${this.apiUrl}/${id}/profile`)
      .pipe(catchError(this.handleError('Profil introuvable')));
  }

  getPoints(id: number): Observable<{ totalPoints: number }> {
    return this.http
      .get<{ totalPoints: number }>(`${this.apiUrl}/${id}/points`)
      .pipe(catchError(this.handleError('Points introuvables')));
  }

  getHistory(id: number): Observable<PointHistory[]> {
    return this.http
      .get<PointHistory[]>(`${this.apiUrl}/${id}/history`)
      .pipe(catchError(this.handleError('Historique introuvable')));
  }

  getBadges(id: number): Observable<UserBadge[]> {
    return this.http
      .get<UserBadge[]>(`${this.apiUrl}/${id}/badges`)
      .pipe(catchError(this.handleError('Badges introuvables')));
  }

  getLeaderboard(authId: number): Observable<LeaderboardEntry[]> {
    return this.http
      .get<LeaderboardEntry[]>(`${this.apiUrl}/leaderboard`, {
        params: { authId: authId.toString() }
      })
      .pipe(catchError(this.handleError('Classement introuvable')));
  }

  getPreferences(id: number): Observable<NotificationPreferences> {
    return this.http
      .get<NotificationPreferences>(`${this.apiUrl}/${id}/preferences`)
      .pipe(catchError(this.handleError('Préférences introuvables')));
  }

  updateProfile(id: number, profile: UpdateProfileRequest): Observable<Profile> {
    return this.http
      .put<Profile>(`${this.apiUrl}/${id}/profile`, profile)
      .pipe(catchError(this.handleError('Profil non mis à jour')));
  }

  updatePreferences(id: number, preferences: UpdatePreferencesRequest): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/${id}/preferences`, preferences)
      .pipe(catchError(this.handleError('Préférences non mises à jour')));
  }

  private handleError(fallback: string) {
    return (error: HttpErrorResponse) =>
      throwError(() => new Error(httpErrorMessage(error, fallback)));
  }
}
