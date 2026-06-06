import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import {
  ActionDetail,
  ActionListFilters,
  ActionSummary,
  Category,
  PublicStats,
  SortBy,
} from '../models/action.model';

@Injectable({
  providedIn: 'root',
})
export class ActionService {
  private readonly apiUrl = environment.actionApi;

  constructor(private http: HttpClient) {}

  getActions(filters?: ActionListFilters): Observable<ActionSummary[]> {
    let params = new HttpParams();
    if (filters?.categoryId != null) {
      params = params.set('categoryId', filters.categoryId);
    }

    return this.http
      .get<ActionSummary[]>(`${this.apiUrl}/actions`, { params })
      .pipe(
        map((actions) => this.applyClientFilters(actions, filters)),
        catchError(this.handleError('Impossible de charger les actions'))
      );
  }

  getActionsForMap(categoryId?: number): Observable<ActionSummary[]> {
    let params = new HttpParams();
    if (categoryId != null) {
      params = params.set('categoryId', categoryId);
    }

    return this.http
      .get<ActionSummary[]>(`${this.apiUrl}/actions/carte`, { params })
      .pipe(
        catchError(this.handleError('Impossible de charger la carte des actions'))
      );
  }

  getActionById(id: number): Observable<ActionDetail> {
    return this.http
      .get<ActionDetail>(`${this.apiUrl}/actions/${id}`)
      .pipe(catchError(this.handleError('Action introuvable')));
  }

  /** Résumés en lot — évite N appels GET /actions/{id} dans l'espace citoyen. */
  getActionSummariesByIds(ids: number[]): Observable<ActionSummary[]> {
    const unique = [...new Set(ids.filter((id) => id > 0))];
    if (!unique.length) {
      return of([]);
    }
    let params = new HttpParams();
    unique.forEach((id) => {
      params = params.append('ids', String(id));
    });
    return this.http
      .get<ActionSummary[]>(`${this.apiUrl}/actions/summaries`, { params })
      .pipe(
        catchError(() =>
          forkJoin(unique.map((id) => this.getActionById(id))).pipe(
            map((details) => details as ActionSummary[])
          )
        ),
        catchError(this.handleError('Impossible de charger les actions'))
      );
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(this.handleError('Impossible de charger les catégories')));
  }

  getPublicStats(): Observable<PublicStats> {
    return this.http
      .get<PublicStats>(`${this.apiUrl}/public/stats`)
      .pipe(catchError(this.handleError('Impossible de charger les statistiques')));
  }

  getAssociationPublishedActionsByAuthId(authId: number): Observable<ActionSummary[]> {
    return this.http
      .get<ActionSummary[]>(`${this.apiUrl}/associations/user/${authId}/actions`)
      .pipe(catchError(this.handleError('Impossible de charger les actions de l\'association')));
  }

  getAssociationPublishedActions(associationId: number): Observable<ActionSummary[]> {
    return this.http
      .get<ActionSummary[]>(`${this.apiUrl}/associations/${associationId}/actions`)
      .pipe(catchError(this.handleError('Impossible de charger les actions de l\'association')));
  }

  getFeaturedActions(limit = 3): Observable<ActionSummary[]> {
    return this.getActions({ sort: 'date' }).pipe(
      map((actions) => actions.filter((a) => !a.isFixed).slice(0, limit))
    );
  }

  private applyClientFilters(
    actions: ActionSummary[],
    filters?: ActionListFilters
  ): ActionSummary[] {
    let result = actions.filter((a) => a.status !== 'CANCELLED' && a.status !== 'DRAFT');

    if (filters?.categoryName) {
      result = result.filter((a) => a.categoryName === filters.categoryName);
    }

    if (filters?.source && filters.source !== 'all') {
      result = result.filter((a) =>
        filters.source === 'fixed' ? a.isFixed : !a.isFixed
      );
    }

    const sort = filters?.sort ?? 'date';
    result.sort((a, b) => this.compareBySort(a, b, sort));

    return result;
  }

  private compareBySort(a: ActionSummary, b: ActionSummary, sort: SortBy): number {
    switch (sort) {
      case 'points':
        return b.points - a.points;
      case 'places':
        return b.availablePlaces - a.availablePlaces;
      case 'date':
      default:
        return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime();
    }
  }

  private handleError(fallback: string) {
    return (error: HttpErrorResponse) =>
      throwError(() => new Error(httpErrorMessage(error, fallback)));
  }
}
