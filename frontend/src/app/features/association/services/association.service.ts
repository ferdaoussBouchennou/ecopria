import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DevContextService } from '../../../core/services/dev-context.service';
import { ActionSummary, ActionDetail } from '../../action/models/action.model';
import { AssociationProfile, UpdateAssociationProfileDTO } from '../models/association-profile.model';

@Injectable({
  providedIn: 'root'
})
export class AssociationService {
  private readonly apiUrl = environment.actionApi;

  constructor(
    private http: HttpClient,
    private devContext: DevContextService
  ) {}

  getAssociationAuthId(): number {
    return this.devContext.getAssociationAuthId();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-User-Id': String(this.devContext.getAssociationActionUserId())
    });
  }

  getMesActions(): Observable<ActionSummary[]> {
    return this.http.get<ActionSummary[]>(
      `${this.apiUrl}/actions/mes-actions`,
      { headers: this.getHeaders() }
    );
  }

  getMesBrouillons(): Observable<ActionSummary[]> {
    return this.http.get<ActionSummary[]>(
      `${this.apiUrl}/actions/mes-brouillons`,
      { headers: this.getHeaders() }
    );
  }

  getMesStats(): Observable<AssociationStats> {
    return this.http.get<AssociationStats>(
      `${this.apiUrl}/actions/mes-stats`,
      { headers: this.getHeaders() }
    );
  }

  getAction(actionId: number): Observable<ActionDetail> {
    return this.http.get<ActionDetail>(
      `${this.apiUrl}/actions/${actionId}`,
      { headers: this.getHeaders() }
    );
  }

  creerAction(action: CreateActionDTO): Observable<ActionDetail> {
    return this.http.post<ActionDetail>(
      `${this.apiUrl}/actions`,
      action,
      { headers: this.getHeaders() }
    );
  }

  modifierAction(actionId: number, action: UpdateActionDTO): Observable<ActionDetail> {
    return this.http.put<ActionDetail>(
      `${this.apiUrl}/actions/${actionId}`,
      action,
      { headers: this.getHeaders() }
    );
  }

  publierAction(actionId: number): Observable<ActionDetail> {
    return this.http.put<ActionDetail>(
      `${this.apiUrl}/actions/${actionId}/publier`,
      {},
      { headers: this.getHeaders() }
    );
  }

  annulerAction(actionId: number, raison: string): Observable<void> {
    const params = new HttpParams().set('reason', raison.trim());

    return this.http.delete<void>(
      `${this.apiUrl}/actions/${actionId}`,
      { headers: this.getHeaders(), params }
    );
  }

  getQRCode(actionId: number): Observable<QRCodeResponse> {
    return this.http.get<QRCodeResponse>(
      `${environment.presenceApi}/qr/${actionId}`
    );
  }

  validerPresenceParPin(pinCode: string, userId: number): Observable<any> {
    return this.http.post<any>(
      `${environment.presenceApi}/valider/pin`,
      { pinCode, userId }
    );
  }

  uploadActionPhoto(actionId: number, formData: FormData): Observable<{photoUrl: string}> {
    return this.http.post<{photoUrl: string}>(
      `${this.apiUrl}/actions/${actionId}/photo`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  // ─── PROFIL ASSOCIATION ───────────────────────────────────

  getProfile(authId: number): Observable<AssociationProfile> {
    return this.http.get<AssociationProfile>(
      `${environment.userApi}/association/${authId}`
    );
  }

  updateProfile(authId: number, profile: UpdateAssociationProfileDTO): Observable<AssociationProfile> {
    return this.http.put<AssociationProfile>(
      `${environment.userApi}/association/${authId}/profile`,
      profile
    );
  }

  uploadLogo(authId: number, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ logoUrl: string }>(
      `${environment.userApi}/association/${authId}/logo`,
      formData,
      { headers: this.getHeaders() }
    );
  }
}

// DTOs
export interface CreateActionDTO {
  title: string;  // Changed from 'titre'
  description: string;
  categoryId: number;
  dateStart: string;
  dateEnd: string;
  address: string;
  city: string;
  latitude: number;  // Made required (not optional)
  longitude: number;  // Made required (not optional)
  maxParticipants: number;
  points: number;
  program?: string[];
  practicalInfos?: string[];
}

export interface UpdateActionDTO extends Partial<CreateActionDTO> {}

export interface QRCodeResponse {
  actionId: number;
  qrCode: string;
  pinCode: string;
}

export interface AssociationStats {
  totalActions: number;
  totalPublished: number;
  totalParticipants: number;
  totalPlaces: number;
  totalPoints: number;
}
