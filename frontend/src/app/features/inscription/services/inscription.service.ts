import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  InscriptionRequest,
  InscriptionResponse,
  ActionDTO
} from '../models/inscription.model';
import { ActionDetail } from '../../action/models/action.model';

// proxy.conf.json redirige :
//   /api/inscriptions  →  http://localhost:8084/inscriptions
//   /api/actions       →  http://localhost:8083/actions
const API_INSCRIPTION = '/api/inscriptions';
const API_ACTION      = '/api/actions';

@Injectable({ providedIn: 'root' })
export class InscriptionService {

  constructor(private http: HttpClient) {}

  // ─── POST /inscriptions ─────────────────────────────────────────────
  // Appelle InscriptionService.inscrire()
  // Retourne statut CONFIRMEE si places dispo, EN_ATTENTE sinon
  inscrire(request: InscriptionRequest): Observable<InscriptionResponse> {
    return this.http
      .post<InscriptionResponse>(API_INSCRIPTION, request)
      .pipe(catchError(this.handleError));
  }

  // ─── GET /inscriptions/user/{userId} ────────────────────────────────
  // Appelle InscriptionService.getMesInscriptions()
  getMesInscriptions(userId: number): Observable<InscriptionResponse[]> {
    return this.http
      .get<InscriptionResponse[]>(`${API_INSCRIPTION}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  // ─── GET /inscriptions/{id} ─────────────────────────────────────────
  // Appelle InscriptionService.getInscription()
  getInscription(id: number): Observable<InscriptionResponse> {
    return this.http
      .get<InscriptionResponse>(`${API_INSCRIPTION}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ─── DELETE /inscriptions/{id} ──────────────────────────────────────
  // Appelle InscriptionService.desinscrire()
  // Publie kafka inscription.annulee → Ferdaouss libere la place
  annuler(inscriptionId: number): Observable<void> {
    return this.http
      .delete<void>(`${API_INSCRIPTION}/${inscriptionId}`)
      .pipe(catchError(this.handleError));
  }

  // ─── GET /actions/{id} ──────────────────────────────────────────────
  // Appelle service-action (port 8083) pour afficher les infos de l'action
  getAction(actionId: number): Observable<ActionDTO> {
    return this.http.get<ActionDetail>(`${API_ACTION}/${actionId}`).pipe(
      map((detail) => this.mapToActionDTO(detail)),
      catchError(this.handleError)
    );
  }

  private mapToActionDTO(detail: ActionDetail): ActionDTO {
    const start = new Date(detail.dateStart);
    const end = new Date(detail.dateEnd);
    const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

    const base: ActionDTO = {
      id: detail.id,
      titre: detail.title,
      description: detail.description,
      categorie: detail.categoryName,
      points: detail.points,
      imageUrl: detail.photoUrls?.[0] || detail.categoryImageUrl,
      isFixed: detail.isFixed,
      practicalInfos: detail.practicalInfos ?? [],
    };

    if (detail.isFixed) {
      return base;
    }

    return {
      ...base,
      lieu: detail.address,
      ville: detail.city,
      dateAction: detail.dateStart,
      heureDebut: start.toLocaleTimeString('fr-FR', timeOpts),
      heureFin: end.toLocaleTimeString('fr-FR', timeOpts),
      placesDisponibles: detail.availablePlaces,
      placesTotal: detail.maxParticipants,
      inscrits: detail.registeredCount,
      associationId: detail.associationId,
      associationName: detail.associationName,
      associationCity: detail.associationCity,
      associationLogoUrl: detail.associationLogoUrl,
    };
  }

  // ─── Gestion d'erreurs ───────────────────────────────────────────────
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';

    if (error.status === 0) {
      message = 'Impossible de joindre le serveur. Verifiez votre connexion.';
    } else if (error.status === 400) {
      // IllegalStateException du backend (deja inscrit, etc.)
      message = error.error?.message || 'Requete invalide.';
    } else if (error.status === 404) {
      message = 'Ressource introuvable.';
    } else if (error.status === 409) {
      message = 'Vous etes deja inscrit a cette action.';
    } else if (error.status >= 500) {
      message = 'Erreur serveur. Veuillez reessayer plus tard.';
    }

    return throwError(() => new Error(message));
  }
}
