import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AvisPartenaire,
  CommissionMensuelle,
  CouponDto,
  CreateRecompenseRequest,
  DashboardPartenaire,
  PartenaireProfil,
  RecompenseItemDto,
  UpdatePartenaireProfil,
  VisibilitePartenaire
} from '../../core/models/recompense.model';
import { DevContextService } from '../../core/services/dev-context.service';

const API_PARTENAIRE = '/api/partenaire';

@Injectable({ providedIn: 'root' })
export class PartenaireService {

  constructor(
    private http: HttpClient,
    private devContext: DevContextService
  ) {}

  private get userId(): number {
    return this.devContext.getPartenaireUserId();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': String(this.userId) });
  }

  getDashboard(): Observable<DashboardPartenaire> {
    return this.http
      .get<DashboardPartenaire>(`${API_PARTENAIRE}/dashboard`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getMesOffres(): Observable<RecompenseItemDto[]> {
    return this.http
      .get<RecompenseItemDto[]>(`${API_PARTENAIRE}/offres`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getOffreById(id: number): Observable<RecompenseItemDto> {
    return this.getMesOffres().pipe(
      map((list: RecompenseItemDto[]) => {
        const found = list.find((o) => o.id === id);
        if (!found) throw new Error('Offre introuvable');
        return found;
      }),
      catchError(this.handleError)
    );
  }

  creerOffre(dto: CreateRecompenseRequest): Observable<RecompenseItemDto> {
    return this.http
      .post<RecompenseItemDto>(`${API_PARTENAIRE}/offres`, dto, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  modifierOffre(id: number, dto: CreateRecompenseRequest): Observable<RecompenseItemDto> {
    return this.http
      .put<RecompenseItemDto>(`${API_PARTENAIRE}/offres/${id}`, dto, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  desactiverOffre(id: number): Observable<void> {
    return this.http
      .delete<void>(`${API_PARTENAIRE}/offres/${id}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  validerCoupon(code: string): Observable<CouponDto> {
    return this.http
      .post<CouponDto>(`${API_PARTENAIRE}/valider-coupon`, { code }, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getCommissions(): Observable<CommissionMensuelle[]> {
    return this.http
      .get<CommissionMensuelle[]>(`${API_PARTENAIRE}/commissions`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getProfil(): Observable<PartenaireProfil> {
    return this.http
      .get<PartenaireProfil>(`${API_PARTENAIRE}/profil`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  updateProfil(dto: UpdatePartenaireProfil): Observable<PartenaireProfil> {
    return this.http
      .put<PartenaireProfil>(`${API_PARTENAIRE}/profil`, dto, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getProfilPublic(partenaireUserId: number): Observable<PartenaireProfil> {
    return this.http
      .get<PartenaireProfil>(`/api/recompenses/public/partenaire/${partenaireUserId}`)
      .pipe(catchError(this.handleError));
  }

  getPartenairesPublics(): Observable<PartenaireProfil[]> {
    return this.http
      .get<PartenaireProfil[]>('/api/recompenses/public/partenaires')
      .pipe(catchError(this.handleError));
  }

  getVisibilite(): Observable<VisibilitePartenaire> {
    return this.http
      .get<VisibilitePartenaire>(`${API_PARTENAIRE}/visibilite`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getAvis(): Observable<AvisPartenaire[]> {
    return this.http
      .get<AvisPartenaire[]>(`${API_PARTENAIRE}/avis`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  repondreAvis(avisId: number, reponse: string): Observable<AvisPartenaire> {
    return this.http
      .put<AvisPartenaire>(`${API_PARTENAIRE}/avis/${avisId}/reponse`, { reponse }, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  toggleOffreActive(id: number): Observable<RecompenseItemDto> {
    return this.http
      .patch<RecompenseItemDto>(`${API_PARTENAIRE}/offres/${id}/toggle-active`, null, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';
    if (error.status === 0) {
      message = 'Impossible de joindre le service récompense. Vérifiez que les services sont démarrés.';
    } else if (typeof error.error === 'string' && error.error.trim()) {
      message = error.error;
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 404) {
      message = 'Partenaire introuvable. Le compte doit être validé par l\'admin.';
    } else if (error.status === 403) {
      message = 'Accès refusé.';
    } else if (error.status === 400) {
      message = 'Requête invalide.';
    } else if (error.status >= 500) {
      message = 'Le service récompenses a rencontré une erreur. Réessayez dans quelques instants.';
    }
    return throwError(() => new Error(message));
  }
}
