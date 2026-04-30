import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActionDetailDto, ActionSummaryDto } from '../models/action.model';

@Injectable({
  providedIn: 'root'
})
export class ActionService {
  private readonly baseUrl = `${environment.api.action}/api/actions`;

  constructor(private readonly http: HttpClient) {}

  getAll(categoryId?: number): Observable<ActionSummaryDto[]> {
    const url = categoryId ? `${this.baseUrl}?categoryId=${categoryId}` : this.baseUrl;
    return this.http.get<ActionSummaryDto[]>(url);
  }

  getDetail(id: number): Observable<ActionDetailDto> {
    return this.http.get<ActionDetailDto>(`${this.baseUrl}/${id}`);
  }
}