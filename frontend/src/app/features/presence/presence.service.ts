import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ParticipantRow,
  PresenceResponse,
  PresenceValidationResult,
  PresenceStatus,
  QrCodeActionResponse,
  QrCode
} from '../../core/models/presence.model';
import { InscriptionResponse } from '../../core/models/inscription.model';

const API_PRESENCES = '/api/presences';
const API_INSCRIPTIONS = '/api/inscriptions';

@Injectable({ providedIn: 'root' })
export class PresenceService {

  constructor(private http: HttpClient) {}

  /** QR code HMAC de l'action (affiché aux participants le jour J) */
  getQrCodeParAction(actionId: number): Observable<QrCodeActionResponse> {
    return this.http
      .get<QrCodeActionResponse>(`${API_PRESENCES}/qr/${actionId}`)
      .pipe(catchError(this.handleError));
  }

  /** Validation présence : qrCode scanné + userId du participant */
  valider(qrCode: string, userId: number): Observable<PresenceValidationResult> {
    return this.http
      .post<PresenceResponse>(`${API_PRESENCES}/valider`, { qrCode, userId })
      .pipe(
        map((res) => this.toValidationResult(res, 'VALIDE', 'Présence validée avec succès.')),
        catchError((err) => throwError(() => new Error(this.mapValidationError(err))))
      );
  }

  /** Participants inscrits à une action (service-inscription) */
  getParticipants(actionId: number): Observable<ParticipantRow[]> {
    return this.http
      .get<InscriptionResponse[]>(`${API_INSCRIPTIONS}/action/${actionId}`)
      .pipe(
        map((rows) =>
          rows.map((r) => ({
            inscriptionId: r.id,
            userId: r.userId,
            statut: r.statut,
            dateInscription: r.dateInscription,
            pointsAction: r.pointsAction
          }))
        ),
        catchError(this.handleError)
      );
  }

  /** Récupérer les QR codes d'un utilisateur (pour mes-qrcodes) */
  getMesQrCodes(userId: number): Observable<QrCode[]> {
    // TODO: Implémenter l'endpoint backend si nécessaire
    // Pour l'instant, retourne un tableau vide
    return this.http
      .get<QrCode[]>(`${API_PRESENCES}/user/${userId}/qrcodes`)
      .pipe(catchError(() => throwError(() => new Error('Endpoint non implémenté'))));
  }

  private toValidationResult(
    res: PresenceResponse,
    status: PresenceStatus,
    message: string
  ): PresenceValidationResult {
    return {
      status,
      message,
      userId: res.userId,
      actionId: res.actionId,
      pointsCredites: res.points
    };
  }

  private mapValidationError(error: HttpErrorResponse): string {
    const backendMsg =
      typeof error.error === 'object' && error.error?.erreur
        ? String(error.error.erreur)
        : '';

    if (error.status === 400) {
      return backendMsg || 'QR Code invalide ou inexistant.';
    }
    if (error.status === 409) {
      return backendMsg || 'Ce participant a déjà validé sa présence.';
    }
    if (error.status === 0) {
      return 'Impossible de joindre le service présence (port 8085).';
    }
    if (error.status >= 500) {
      return backendMsg || 'Erreur serveur service-présence.';
    }
    return backendMsg || 'Validation impossible.';
  }

  toUiStatus(message: string, httpStatus?: number): PresenceStatus {
    const m = message.toLowerCase();
    if (m.includes('déjà') || m.includes('deja') || httpStatus === 409) {
      return 'DEJA_VALIDE';
    }
    if (m.includes('invalide') || m.includes('inexistant') || httpStatus === 400) {
      return 'QR_INVALIDE';
    }
    if (m.includes('fraude')) {
      return 'FRAUDE_DETECTEE';
    }
    if (m.includes('gps') || m.includes('zone')) {
      return 'GPS_HORS_ZONE';
    }
    return 'ERREUR';
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';
    if (error.status === 0) {
      message = 'Impossible de joindre le serveur. Vérifiez que les microservices sont démarrés.';
    } else if (error.error?.erreur) {
      message = error.error.erreur;
    } else if (error.status === 404) {
      message = 'Ressource introuvable.';
    }
    return throwError(() => new Error(message));
  }
}
