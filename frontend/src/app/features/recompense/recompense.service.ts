import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CouponDto,
  PartenaireProfil,
  RecompenseItemDto,
  RecompenseType,
  ResultatMystereBox
} from '../../core/models/recompense.model';

const API = '/api/recompenses';

@Injectable({ providedIn: 'root' })
export class RecompenseService {

  private readonly userId = 1;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': String(this.userId) });
  }

  getCatalogue(type?: RecompenseType): Observable<RecompenseItemDto[]> {
    const q = type ? `?type=${type}` : '';
    return this.http.get<RecompenseItemDto[]>(`${API}${q}`).pipe(catchError(this.handleError));
  }

  getDetail(id: number): Observable<RecompenseItemDto> {
    return this.http.get<RecompenseItemDto>(`${API}/${id}`).pipe(catchError(this.handleError));
  }

  enregistrerClic(id: number): Observable<void> {
    return this.http.post<void>(`${API}/${id}/clic`, null).pipe(catchError(this.handleError));
  }

  echanger(recompenseId: number): Observable<CouponDto> {
    return this.http
      .post<CouponDto>(`${API}/echanger`, { recompenseId }, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  ouvrirMystereBox(recompenseId: number): Observable<ResultatMystereBox> {
    return this.http
      .post<ResultatMystereBox>(`${API}/${recompenseId}/mystere-box`, null, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getMesCoupons(): Observable<CouponDto[]> {
    return this.http
      .get<CouponDto[]>(`${API}/mes-coupons`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getProfilPublic(partenaireUserId: number): Observable<PartenaireProfil> {
    return this.http
      .get<PartenaireProfil>(`${API}/public/partenaire/${partenaireUserId}`)
      .pipe(catchError(this.handleError));
  }

  getOffresByPartenaire(partenaireUserId: number): Observable<RecompenseItemDto[]> {
    return this.http
      .get<RecompenseItemDto[]>(`${API}/public/partenaire/${partenaireUserId}/offres`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';
    if (error.status === 0) {
      message = 'Impossible de joindre le service récompense (port 9093).';
    } else if (typeof error.error === 'string') {
      message = error.error;
    } else if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => new Error(message));
  }
}
