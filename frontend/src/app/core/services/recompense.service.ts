import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { httpErrorMessage } from '../utils/http-error.util';
import {
  RecompenseItemDto,
  CouponDto,
  CouponViewModel,
  EchangerRecompenseDto,
  RecompenseType
} from '../models/recompense.model';

@Injectable({
  providedIn: 'root',
})
export class RecompenseService {
  private readonly apiUrl = environment.recompenseApi;

  constructor(private http: HttpClient) {}

  getCatalogue(type?: RecompenseType): Observable<RecompenseItemDto[]> {
    let params: any = {};
    if (type) {
      params.type = type;
    }
    return this.http
      .get<RecompenseItemDto[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError('Catalogue introuvable')));
  }

  getDetail(id: number): Observable<RecompenseItemDto> {
    return this.http
      .get<RecompenseItemDto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError('Récompense introuvable')));
  }

  echanger(userId: number, recompenseId: number): Observable<CouponDto> {
    const headers = new HttpHeaders().set('X-User-Id', userId.toString());
    const dto: EchangerRecompenseDto = { recompenseId };
    return this.http
      .post<CouponDto>(`${this.apiUrl}/echanger`, dto, { headers })
      .pipe(catchError(this.handleError('Échange impossible')));
  }

  getMesCoupons(userId: number): Observable<CouponDto[]> {
    const headers = new HttpHeaders().set('X-User-Id', userId.toString());
    return this.http
      .get<CouponDto[]>(`${this.apiUrl}/mes-coupons`, { headers })
      .pipe(catchError(this.handleError('Coupons introuvables')));
  }

  private handleError(fallback: string) {
    return (error: HttpErrorResponse) =>
      throwError(() => new Error(httpErrorMessage(error, fallback)));
  }
}
