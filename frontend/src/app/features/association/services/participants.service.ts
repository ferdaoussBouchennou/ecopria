import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Participant, ParticipantsStats } from '../models/participant.model';
import { InscriptionResponse } from '../../inscription/models/inscription.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantsService {
  private readonly apiInscriptions = environment.inscriptionApi;

  constructor(private http: HttpClient) {}

  getParticipants(actionId: number): Observable<Participant[]> {
    return this.http
      .get<InscriptionResponse[]>(`${this.apiInscriptions}/action/${actionId}`)
      .pipe(
        map((inscriptions) => inscriptions.map((inscription) => this.toParticipant(inscription))),
        catchError((error) => {
          console.error('Erreur récupération participants:', error);
          return of([]);
        })
      );
  }

  private toParticipant(inscription: InscriptionResponse): Participant {
    return {
      inscriptionId: inscription.id,
      userId: inscription.userId,
      actionId: inscription.actionId,
      dateInscription: inscription.dateInscription,
      statut: inscription.statut,
      pointsAction: inscription.pointsAction,
      firstName: inscription.firstName || 'Citoyen',
      lastName: inscription.lastName || `#${inscription.userId}`,
      email: inscription.email || '—',
      phone: inscription.phone || '—',
      photoUrl: inscription.photoUrl,
      city: inscription.city || '—',
      motivation: inscription.motivation?.trim() || undefined,
      conditions: inscription.conditions?.trim() || undefined,
      imageRights: inscription.imageRights,
      newsletter: inscription.newsletter,
      accompagnants: inscription.accompagnants
    };
  }

  calculateStats(participants: Participant[]): ParticipantsStats {
    return {
      total: participants.length,
      confirmes: participants.filter((p) => p.statut === 'CONFIRMEE').length,
      enAttente: participants.filter((p) => p.statut === 'EN_ATTENTE').length,
      annules: participants.filter((p) => p.statut === 'ANNULEE').length
    };
  }

  exportToCSV(participants: Participant[], actionTitle: string): void {
    const headers = [
      'Nom',
      'Prénom',
      'Email',
      'Téléphone',
      'Ville',
      'Date inscription',
      'Statut',
      'Points',
      'Motivation',
      'Conditions médicales / allergies',
      'Droit à l\'image',
      'Newsletter'
    ];
    const rows = participants.map((p) => [
      p.lastName || '',
      p.firstName || '',
      p.email || '',
      p.phone || '',
      p.city || '',
      this.formatDate(p.dateInscription),
      this.getStatutLabel(p.statut),
      p.pointsAction.toString(),
      p.motivation || '',
      p.conditions || '',
      p.imageRights ? 'Oui' : 'Non',
      p.newsletter ? 'Oui' : 'Non'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `participants_${this.sanitizeFileName(actionTitle)}_${this.formatDateForFile(new Date())}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDateForFile(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      CONFIRMEE: 'Confirmé',
      EN_ATTENTE: 'En attente',
      ANNULEE: 'Annulé'
    };
    return labels[statut] || statut;
  }
}
