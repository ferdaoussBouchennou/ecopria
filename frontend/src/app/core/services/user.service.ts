import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../utils/http-error.util';
import { resolveUploadUrl } from '../utils/upload-url.util';
import {
  Profile,
  PointHistory,
  UserBadge,
  BadgeStatus,
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
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}/profile`)
      .pipe(
        map((raw) => this.normalizeProfile(raw)),
        catchError(this.handleError('Profil introuvable'))
      );
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

  getBadgesStatus(id: number): Observable<BadgeStatus[]> {
    return this.http
      .get<Record<string, unknown>[]>(`${this.apiUrl}/${id}/badges/status`)
      .pipe(
        map((rows) => rows.map((row) => this.normalizeBadgeStatus(row))),
        catchError(this.handleError('Badges introuvables'))
      );
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
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}/profile`, profile)
      .pipe(
        map((raw) => this.normalizeProfile(raw)),
        catchError(this.handleError('Profil non mis à jour'))
      );
  }

  uploadPhoto(id: number, file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http
      .post<{ photoUrl: string }>(`${this.apiUrl}/${id}/photo`, formData)
      .pipe(catchError(this.handleError('Photo non enregistrée')));
  }

  updatePreferences(id: number, preferences: UpdatePreferencesRequest): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/${id}/preferences`, preferences)
      .pipe(catchError(this.handleError('Préférences non mises à jour')));
  }

  private normalizeProfile(raw: Record<string, unknown>): Profile {
    return {
      id: Number(raw['id'] ?? 0),
      authId: Number(raw['authId'] ?? raw['auth_id'] ?? 0),
      firstName: String(raw['firstName'] ?? raw['first_name'] ?? ''),
      lastName: String(raw['lastName'] ?? raw['last_name'] ?? ''),
      email: String(raw['email'] ?? ''),
      phone: this.optionalString(raw['phone']),
      address: this.optionalString(raw['address']),
      city: this.optionalString(raw['city']),
      totalPoints: Number(raw['totalPoints'] ?? raw['total_points'] ?? 0),
      trustScore: Number(raw['trustScore'] ?? raw['trust_score'] ?? 100),
      photo: resolveUploadUrl(this.optionalString(raw['photo'])),
      createdAt: String(raw['createdAt'] ?? raw['created_at'] ?? '')
    };
  }

  private normalizeBadgeStatus(raw: Record<string, unknown>): BadgeStatus {
    return {
      id: Number(raw['id'] ?? 0),
      name: String(raw['name'] ?? ''),
      description: String(raw['description'] ?? ''),
      icon: String(raw['icon'] ?? '●'),
      requiredPoints: Number(raw['requiredPoints'] ?? raw['required_points'] ?? 0),
      obtained: Boolean(raw['obtained'] ?? false)
    };
  }

  private optionalString(value: unknown): string | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    return String(value);
  }

  private handleError(fallback: string) {
    return (error: HttpErrorResponse) =>
      throwError(() => new Error(httpErrorMessage(error, fallback)));
  }
}
