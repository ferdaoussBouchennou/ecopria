import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { AssociationPublicProfil } from '../models/association-public.model';

@Injectable({ providedIn: 'root' })
export class AssociationPublicService {
  private readonly apiUrl = environment.userApi;

  constructor(private http: HttpClient) {}

  getAssociationsPublics(): Observable<AssociationPublicProfil[]> {
    return this.http
      .get<AssociationPublicProfil[]>(`${this.apiUrl}/public/associations`)
      .pipe(catchError(this.handleError('Impossible de charger les associations')));
  }

  getAssociationPublic(authId: number): Observable<AssociationPublicProfil> {
    return this.http
      .get<AssociationPublicProfil>(`${this.apiUrl}/public/association/${authId}`)
      .pipe(catchError(this.handleError('Association introuvable')));
  }

  private handleError(fallback: string) {
    return (error: HttpErrorResponse) =>
      throwError(() => new Error(httpErrorMessage(error, fallback)));
  }
}
