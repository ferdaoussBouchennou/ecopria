import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { AssociationPublicProfil } from '../models/association-public.model';

interface AssociationPublicApiDto {
  id: number;
  userId: number;
  name: string;
  description?: string;
  logoUrl?: string;
  city?: string;
}

@Injectable({ providedIn: 'root' })
export class AssociationPublicService {
  private readonly actionApi = environment.actionApi;
  private readonly userApi = environment.userApi;

  constructor(private http: HttpClient) {}

  getAssociationsPublics(): Observable<AssociationPublicProfil[]> {
    return this.loadFromActionApi().pipe(
      switchMap((profils) => this.enrichListWithUserProfiles(profils))
    );
  }

  getAssociationPublic(authId: number): Observable<AssociationPublicProfil> {
    return this.http
      .get<AssociationPublicApiDto>(`${this.actionApi}/associations/public/${authId}`)
      .pipe(
        map((item) => this.toProfil(item)),
        switchMap((profil) => this.enrichWithUserProfile(authId, profil)),
        catchError((err) => this.fallbackProfil(authId, err))
      );
  }

  private loadFromActionApi(): Observable<AssociationPublicProfil[]> {
    return this.http.get<AssociationPublicApiDto[]>(`${this.actionApi}/associations/public`).pipe(
      map((items) => items.map((item) => this.toProfil(item))),
      catchError((err) => this.fallbackList(err))
    );
  }

  private enrichListWithUserProfiles(
    profils: AssociationPublicProfil[]
  ): Observable<AssociationPublicProfil[]> {
    if (!profils.length) {
      return of([]);
    }
    return forkJoin(profils.map((profil) => this.enrichWithUserProfile(profil.authId, profil)));
  }

  private enrichWithUserProfile(
    authId: number,
    base: AssociationPublicProfil
  ): Observable<AssociationPublicProfil> {
    return this.http.get<AssociationPublicProfil>(`${this.userApi}/public/association/${authId}`).pipe(
      map((extra) => this.mergeProfil(base, extra)),
      catchError(() => of(base))
    );
  }

  private mergeProfil(
    base: AssociationPublicProfil,
    extra: AssociationPublicProfil
  ): AssociationPublicProfil {
    return {
      ...base,
      address: extra.address ?? base.address,
      description: extra.description?.trim() ? extra.description : base.description,
      logo: extra.logo?.trim() ? extra.logo : base.logo,
      city: extra.city?.trim() ? extra.city : base.city,
    };
  }

  private fallbackList(err: HttpErrorResponse): Observable<AssociationPublicProfil[]> {
    if (err.status !== 404 && err.status !== 0) {
      return throwError(() => new Error(httpErrorMessage(err, 'Impossible de charger les associations')));
    }
    return this.http
      .get<AssociationPublicProfil[]>(`${this.userApi}/public/associations`)
      .pipe(catchError(this.handleError('Impossible de charger les associations')));
  }

  private fallbackProfil(
    authId: number,
    err: HttpErrorResponse
  ): Observable<AssociationPublicProfil> {
    if (err.status !== 404 && err.status !== 0) {
      return throwError(() => new Error(httpErrorMessage(err, 'Association introuvable')));
    }
    return this.http
      .get<AssociationPublicProfil>(`${this.userApi}/public/association/${authId}`)
      .pipe(catchError(this.handleError('Association introuvable')));
  }

  private toProfil(dto: AssociationPublicApiDto): AssociationPublicProfil {
    return {
      id: dto.id,
      authId: dto.userId,
      name: dto.name,
      description: dto.description,
      logo: dto.logoUrl,
      city: dto.city,
    };
  }

  private handleError(fallback: string) {
    return (error: HttpErrorResponse) =>
      throwError(() => new Error(httpErrorMessage(error, fallback)));
  }
}
