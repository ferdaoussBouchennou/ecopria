import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  InscriptionRequest,
  InscriptionResponse
} from '../../core/models/inscription.model';
import { ActionDetail } from '../action/models/action.model';
import { ActionDTO } from './models/inscription.model';

const API_INSCRIPTION = '/api/inscriptions';
const API_ACTION = '/api/actions';

@Injectable({ providedIn: 'root' })
export class InscriptionService {

  constructor(private http: HttpClient) {}

  inscrire(request: InscriptionRequest): Observable<InscriptionResponse> {
    return this.http
      .post<InscriptionResponse>(API_INSCRIPTION, request)
      .pipe(catchError(this.handleError));
  }

  getMesInscriptions(userId: number): Observable<InscriptionResponse[]> {
    return this.http
      .get<InscriptionResponse[]>(`${API_INSCRIPTION}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getInscription(id: number): Observable<InscriptionResponse> {
    return this.http
      .get<InscriptionResponse>(`${API_INSCRIPTION}/${id}`)
      .pipe(catchError(this.handleError));
  }

  annuler(inscriptionId: number): Observable<void> {
    return this.http
      .delete<void>(`${API_INSCRIPTION}/${inscriptionId}`)
      .pipe(catchError(this.handleError));
  }

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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';

    if (error.status === 0) {
      message = 'Impossible de joindre l\'API Gateway (port 8080). Vérifiez que la gateway et les microservices sont démarrés.';
    } else if (error.error?.erreur) {
      message = error.error.erreur;
    } else if (error.status === 409) {
      message = 'Vous êtes déjà inscrit à cette action.';
    } else if (error.status === 404) {
      message = 'Ressource introuvable.';
    } else if (error.status >= 500) {
      message = 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return throwError(() => new Error(message));
  }
}
