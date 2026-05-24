import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActionDetail,
  ActionListFilters,
  ActionSourceFilter,
  ActionSummary,
  Category,
  SortBy,
} from '../models/action.model';
import {
  MOCK_ACTION_DETAILS,
  MOCK_ACTIONS,
  MOCK_CATEGORIES,
} from '../data/mock-actions.data';

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
        catchError(() => of(this.applyClientFilters(MOCK_ACTIONS, filters)))
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
        catchError(() => of(MOCK_ACTIONS))
      );
  }

  getActionById(id: number): Observable<ActionDetail> {
    return this.http.get<ActionDetail>(`${this.apiUrl}/actions/${id}`).pipe(
      catchError(() => {
        const mock = MOCK_ACTION_DETAILS[id];
        if (!mock) {
          throw new Error('Action introuvable');
        }
        return of(mock);
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(() => of(MOCK_CATEGORIES)));
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
    let result = [...actions];

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
}
