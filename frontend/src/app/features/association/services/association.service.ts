import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActionSummary, ActionDetail } from '../../action/models/action.model';

@Injectable({
  providedIn: 'root'
})
export class AssociationService {
  private readonly apiUrl = environment.actionApi;
  
  // TODO: Récupérer le vrai userId depuis le service d'authentification
  private readonly userId = 1; // Temporaire pour le développement

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-User-Id': this.userId.toString()
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

  annulerAction(actionId: number, raison?: string): Observable<void> {
    let params = new HttpParams();
    if (raison) {
      params = params.set('reason', raison);
    }

    return this.http.delete<void>(
      `${this.apiUrl}/actions/${actionId}`,
      { headers: this.getHeaders(), params }
    );
  }

  getQRCode(actionId: number): Observable<QRCodeResponse> {
    return this.http.get<QRCodeResponse>(
      `${environment.presenceApi}/presences/qr/${actionId}`
    );
  }
}

// DTOs
export interface CreateActionDTO {
  titre: string;
  description: string;
  categoryId: number;
  dateStart: string;
  dateEnd: string;
  address: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  maxParticipants: number;
  points: number;
  program?: string[];
  practicalInfos?: string[];
  photoUrls?: string[];
  isFixed: boolean;
  statut: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateActionDTO extends Partial<CreateActionDTO> {}

export interface QRCodeResponse {
  actionId: number;
  qrCode: string;
}
