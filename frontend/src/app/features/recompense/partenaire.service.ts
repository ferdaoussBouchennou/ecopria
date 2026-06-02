import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AvisPartenaire,
  CommissionMensuelle,
  Coupon,
  CreateRecompenseRequest,
  DashboardPartenaire,
  PartenaireProfil,
  Recompense,
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

  getMesOffres(): Observable<Recompense[]> {
    return this.http
      .get<Recompense[]>(`${API_PARTENAIRE}/offres`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  getOffreById(id: number): Observable<Recompense> {
    return this.getMesOffres().pipe(
      map((list: Recompense[]) => {
        const found = list.find((o) => o.id === id);
        if (!found) throw new Error('Offre introuvable');
        return found;
      }),
      catchError(this.handleError)
    );
  }

  creerOffre(dto: CreateRecompenseRequest): Observable<Recompense> {
    return this.http
      .post<Recompense>(`${API_PARTENAIRE}/offres`, dto, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  modifierOffre(id: number, dto: CreateRecompenseRequest): Observable<Recompense> {
    return this.http
      .put<Recompense>(`${API_PARTENAIRE}/offres/${id}`, dto, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  desactiverOffre(id: number): Observable<void> {
    return this.http
      .delete<void>(`${API_PARTENAIRE}/offres/${id}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  validerCoupon(code: string): Observable<Coupon> {
    return this.http
      .post<Coupon>(`${API_PARTENAIRE}/valider-coupon`, { code }, { headers: this.headers() })
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

  toggleOffreActive(id: number): Observable<Recompense> {
    return this.http
      .patch<Recompense>(`${API_PARTENAIRE}/offres/${id}/toggle-active`, null, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';
    if (error.status === 0) {
      message = 'Impossible de joindre le service récompense (port 9093). Vérifiez Docker.';
    } else if (typeof error.error === 'string') {
      message = error.error;
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 404) {
      message = 'Partenaire introuvable. Le compte doit être validé par l\'admin (Kafka partenaire.validee).';
    }
    return throwError(() => new Error(message));
  }
}
