import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CouponDto, RecompenseItemDto } from '../models/recompense.model';

@Injectable({
  providedIn: 'root'
})
export class RecompenseService {
  private readonly baseUrl = `${environment.api.recompense}/api/recompenses`;

  constructor(private readonly http: HttpClient) {}

  getCatalogue(): Observable<RecompenseItemDto[]> {
    return this.http.get<RecompenseItemDto[]>(this.baseUrl);
  }

  getMesCoupons(userId: number): Observable<CouponDto[]> {
    return this.http.get<CouponDto[]>(`${this.baseUrl}/mes-coupons`, {
      headers: new HttpHeaders({ 'X-User-Id': String(userId) })
    });
  }

  echanger(userId: number, recompenseId: number): Observable<CouponDto> {
    return this.http.post<CouponDto>(`${this.baseUrl}/echanger`, { recompenseId }, {
      headers: new HttpHeaders({ 'X-User-Id': String(userId) })
    });
  }
}