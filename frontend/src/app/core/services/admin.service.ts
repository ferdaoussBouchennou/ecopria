import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  AdminLog,
  AdminConfiguration,
  AdminDashboard,
  AccountValidationsPage,
  AccountValidationFilter,
  ActionAssociationOption,
  ActionAssociationRequest,
  ActionFixe,
  ActionFixeRequest,
  ActionNonFixe,
  ActionNonFixeDetail,
  AdminPendingAccount,
  AdminCategorie,
  AdminCategorieRequest,
  ActionDbCategory,
  CategoryDeletePreview,
  AdminAssociationProfile,
  AdminAssociationProfileRequest,
  ModerationAction,
  AdminUser,
  AdminUserActionResult,
  AdminUsersQuery,
  UtilisateurAssociationProfile,
  UtilisateurCitizenProfile,
  UtilisateurPartnerProfile,
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

  getAccountValidations(filter: AccountValidationFilter): Observable<AccountValidationsPage> {
    return this.http.get<AccountValidationsPage>(`${this.base}/accounts/validations`, {
      headers: this.authHeaders(),
      params: { filter },
    });
  }

  getAccountVerificationDocument(userId: number): Observable<Blob> {
    return this.http.get(`${this.base}/accounts/${userId}/document`, {
      headers: this.authHeaders(),
      responseType: 'blob',
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

  approvePartenaire(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/partenaires/${id}/approve`, null, {
      headers: this.writeHeaders(),
    });
  }

  rejectPartenaire(id: number, raison: string): Observable<void> {
    return this.http.put<void>(
      `${this.base}/partenaires/${id}/reject`,
      { raison },
      { headers: this.writeHeaders() }
    );
  }

  deactivateAssociation(id: number, raison: string): Observable<void> {
    return this.http.put<void>(
      `${this.base}/associations/${id}/deactivate`,
      { raison },
      { headers: this.writeHeaders() }
    );
  }

  deactivatePartenaire(id: number, raison: string): Observable<void> {
    return this.http.put<void>(
      `${this.base}/partenaires/${id}/deactivate`,
      { raison },
      { headers: this.writeHeaders() }
    );
  }

  getUtilisateurCitizenProfile(authId: number): Observable<UtilisateurCitizenProfile> {
    return this.http.get<UtilisateurCitizenProfile>(`${environment.userApi}/${authId}/profile`);
  }

  getUtilisateurAssociationProfile(authId: number): Observable<UtilisateurAssociationProfile> {
    return this.http.get<UtilisateurAssociationProfile>(
      `${environment.userApi}/admin/associations/${authId}`
    );
  }

  getUtilisateurPartnerProfile(authId: number): Observable<UtilisateurPartnerProfile> {
    return this.http.get<UtilisateurPartnerProfile>(`${environment.userApi}/partner/${authId}`);
  }

  getLogs(): Observable<AdminLog[]> {
    return this.http.get<AdminLog[]>(`${this.base}/logs`, {
      headers: this.authHeaders(),
    });
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

  getActionsFixes(): Observable<ActionFixe[]> {
    return this.http.get<ActionFixe[]>(`${this.base}/actions-fixes`, {
      headers: this.authHeaders(),
    });
  }

  createActionFixe(body: ActionFixeRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/actions-fixes`, body, {
      headers: this.writeHeaders(),
    });
  }

  updateActionFixe(id: number, body: ActionFixeRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/actions-fixes/${id}`, body, {
      headers: this.writeHeaders(),
    });
  }

  deactivateActionFixe(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/actions-fixes/${id}/deactivate`, null, {
      headers: this.writeHeaders(),
    });
  }

  activateActionFixe(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/actions-fixes/${id}/activate`, null, {
      headers: this.writeHeaders(),
    });
  }

  getActionsNonFixes(): Observable<ActionNonFixe[]> {
    return this.http.get<ActionNonFixe[]>(`${this.base}/actions`, {
      headers: this.authHeaders(),
    });
  }

  getActionAssociations(): Observable<ActionAssociationOption[]> {
    return this.http.get<ActionAssociationOption[]>(`${this.base}/actions/associations`, {
      headers: this.authHeaders(),
    });
  }

  getActionNonFixe(id: number): Observable<ActionNonFixeDetail> {
    return this.http.get<ActionNonFixeDetail>(`${this.base}/actions/${id}`, {
      headers: this.authHeaders(),
    });
  }

  createActionNonFixe(body: ActionAssociationRequest): Observable<ActionNonFixeDetail> {
    return this.http.post<ActionNonFixeDetail>(`${this.base}/actions`, body, {
      headers: this.writeHeaders(),
    });
  }

  updateActionNonFixe(id: number, body: ActionAssociationRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/actions/${id}`, body, {
      headers: this.writeHeaders(),
    });
  }

  uploadActionPhoto(actionId: number, file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<{ photoUrl: string }>(`${this.base}/actions/${actionId}/photo`, formData, {
      headers: this.writeHeaders(),
    });
  }

  deactivateActionNonFixe(id: number, raison?: string): Observable<void> {
    return this.http.put<void>(`${this.base}/actions/${id}/deactivate`, { raison }, {
      headers: this.writeHeaders(),
    });
  }

  activateActionNonFixe(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/actions/${id}/activate`, null, {
      headers: this.writeHeaders(),
    });
  }

  getCategories(): Observable<AdminCategorie[]> {
    return this.http.get<AdminCategorie[]>(`${this.base}/categories`, {
      headers: this.authHeaders(),
    });
  }

  createCategory(body: AdminCategorieRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/categories`, body, {
      headers: this.writeHeaders(),
    });
  }

  updateCategory(id: number, body: AdminCategorieRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/categories/${id}`, body, {
      headers: this.writeHeaders(),
    });
  }

  publishCategory(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/categories/${id}/publish`, null, {
      headers: this.writeHeaders(),
    });
  }

  unpublishCategory(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/categories/${id}/unpublish`, null, {
      headers: this.writeHeaders(),
    });
  }

  deleteCategory(id: number, cascade = false): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`, {
      headers: this.writeHeaders(),
      params: cascade ? { cascade: 'true' } : {},
    });
  }

  getCategoryDeletePreview(id: number): Observable<CategoryDeletePreview> {
    return this.http.get<CategoryDeletePreview>(`${this.base}/categories/${id}/delete-preview`, {
      headers: this.authHeaders(),
    });
  }

  getActionDbCategories(): Observable<ActionDbCategory[]> {
    return this.http.get<ActionDbCategory[]>(`${this.base}/categories/action-db`, {
      headers: this.authHeaders(),
    });
  }

  getUsers(query: AdminUsersQuery = {}): Observable<AdminUser[]> {
    const params: Record<string, string> = {};
    if (query.email?.trim()) {
      params['email'] = query.email.trim();
    }
    if (query.role?.trim()) {
      params['role'] = query.role.trim();
    }
    if (query.isActive != null) {
      params['isActive'] = String(query.isActive);
    }
    if (query.isVerified != null) {
      params['isVerified'] = String(query.isVerified);
    }
    return this.http.get<AdminUser[]>(`${this.base}/users`, {
      headers: this.authHeaders(),
      params,
    });
  }

  banUser(userId: number, raison: string): Observable<AdminUserActionResult> {
    return this.http.put<AdminUserActionResult>(
      `${this.base}/users/${userId}/ban`,
      { raison },
      { headers: this.writeHeaders() }
    );
  }

  reactivateUser(userId: number): Observable<AdminUserActionResult> {
    return this.http.put<AdminUserActionResult>(
      `${this.base}/users/${userId}/reactivate`,
      null,
      { headers: this.writeHeaders() }
    );
  }

  getModerationActions(): Observable<ModerationAction[]> {
    return this.http.get<ModerationAction[]>(`${this.base}/moderation/actions`, {
      headers: this.authHeaders(),
    });
  }

  publishModerationAction(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/moderation/actions/${id}/publish`, null, {
      headers: this.writeHeaders(),
    });
  }

  suspendModerationAction(id: number, raison?: string): Observable<void> {
    return this.http.put<void>(
      `${this.base}/moderation/actions/${id}/suspend`,
      raison ? { raison } : null,
      { headers: this.writeHeaders() }
    );
  }

  uploadCategoryImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.base}/categories/upload-image`, formData, {
      headers: this.writeHeaders(),
    });
  }

  getAssociationProfiles(): Observable<AdminAssociationProfile[]> {
    return this.http.get<AdminAssociationProfile[]>(`${this.base}/association-profiles`, {
      headers: this.authHeaders(),
    });
  }

  getAssociationProfile(id: number): Observable<AdminAssociationProfile> {
    return this.http.get<AdminAssociationProfile>(`${this.base}/association-profiles/${id}`, {
      headers: this.authHeaders(),
    });
  }

  createAssociationProfile(body: AdminAssociationProfileRequest): Observable<AdminAssociationProfile> {
    return this.http.post<AdminAssociationProfile>(`${this.base}/association-profiles`, body, {
      headers: this.writeHeaders(),
    });
  }

  updateAssociationProfile(id: number, body: AdminAssociationProfileRequest): Observable<AdminAssociationProfile> {
    return this.http.put<AdminAssociationProfile>(`${this.base}/association-profiles/${id}`, body, {
      headers: this.writeHeaders(),
    });
  }

  uploadAssociationLogo(id: number, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ logoUrl: string }>(`${this.base}/association-profiles/${id}/logo`, formData, {
      headers: this.writeHeaders(),
    });
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
