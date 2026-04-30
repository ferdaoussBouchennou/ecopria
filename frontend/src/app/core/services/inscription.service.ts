import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonInscriptionDto } from '../models/action.model';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {
  private readonly baseUrl = `${environment.api.inscription}/api/inscriptions`;

  constructor(private readonly http: HttpClient) {}

  /** Liste des inscriptions de l'utilisateur courant (Mes actions). */
  getMesActions(userId: number): Observable<MonInscriptionDto[]> {
    return this.http.get<MonInscriptionDto[]>(`${this.baseUrl}/mes-actions?userId=${userId}`);
  }
}
