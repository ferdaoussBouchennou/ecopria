import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  AdminConfiguration,
  AdminDashboard,
  AdminPendingAccount,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = environment.adminApi;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.base}/dashboard`, {
      headers: this.authHeaders(),
    });
  }

  getPendingAssociations(): Observable<AdminPendingAccount[]> {
    return this.http.get<AdminPendingAccount[]>(`${this.base}/associations/pending`, {
      headers: this.authHeaders(),
    });
  }

  getPendingPartenaires(): Observable<AdminPendingAccount[]> {
    return this.http.get<AdminPendingAccount[]>(`${this.base}/partenaires/pending`, {
      headers: this.authHeaders(),
    });
  }

  approveAssociation(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/associations/${id}/approve`, null, {
      headers: this.writeHeaders(),
    });
  }

  rejectAssociation(id: number, raison: string): Observable<void> {
    return this.http.put<void>(
      `${this.base}/associations/${id}/reject`,
      { raison },
      { headers: this.writeHeaders() }
    );
  }

  getConfigurations(): Observable<AdminConfiguration[]> {
    return this.http.get<AdminConfiguration[]>(`${this.base}/configurations`, {
      headers: this.authHeaders(),
    });
  }

  updateConfiguration(cle: string, valeur: string, description?: string): Observable<AdminConfiguration> {
    return this.http.put<AdminConfiguration>(
      `${this.base}/configurations/${encodeURIComponent(cle)}`,
      { valeur, description },
      { headers: this.writeHeaders() }
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private writeHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    const userId = this.auth.getUserId();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (userId != null) {
      headers['X-User-Id'] = String(userId);
    }
    return new HttpHeaders(headers);
  }
}
