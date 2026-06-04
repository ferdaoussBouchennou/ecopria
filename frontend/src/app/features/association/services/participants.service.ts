import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Participant, ParticipantsStats } from '../models/participant.model';
import { InscriptionResponse } from '../../inscription/models/inscription.model';
import { PresenceResponse } from '../../../core/models/presence.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantsService {
  private readonly apiInscriptions = environment.inscriptionApi;
  private readonly apiPresences = environment.presenceApi;

  constructor(private http: HttpClient) {}

  getParticipants(actionId: number): Observable<Participant[]> {
    return forkJoin({
      inscriptions: this.http.get<InscriptionResponse[]>(`${this.apiInscriptions}/action/${actionId}`).pipe(
        catchError((error) => {
          console.error('Erreur récupération participants:', error);
          return of([] as InscriptionResponse[]);
        })
      ),
      presences: this.http.get<PresenceResponse[]>(`${this.apiPresences}/action/${actionId}`).pipe(
        catchError((error) => {
          console.error('Erreur récupération présences:', error);
          return of([] as PresenceResponse[]);
        })
      ),
    }).pipe(
      map(({ inscriptions, presences }) => {
        const presenceByUser = new Map(presences.map((p) => [p.userId, p]));
        return inscriptions.map((inscription) => {
          const presence = presenceByUser.get(inscription.userId);
          return {
            ...this.toParticipant(inscription),
            presenceValidee: !!presence,
            pointsGagnes: presence?.points ?? null,
          };
        });
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
      trustScore: inscription.trustScore,
      enAttenteMotif: inscription.enAttenteMotif as Participant['enAttenteMotif'],
    };
  }

  confirmerAttenteConfiance(inscriptionId: number): Observable<InscriptionResponse> {
    return this.http.post<InscriptionResponse>(
      `${this.apiInscriptions}/${inscriptionId}/confirmer-confiance`,
      {}
    );
  }

  refuserAttenteConfiance(inscriptionId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiInscriptions}/${inscriptionId}/refuser-confiance`,
      {}
    );
  }

  calculateStats(participants: Participant[]): ParticipantsStats {
    const actifs = participants.filter((p) => p.statut !== 'ANNULEE');
    const valides = actifs.filter((p) => p.presenceValidee);
    return {
      total: actifs.length,
      confirmes: actifs.filter((p) => p.statut === 'CONFIRMEE').length,
      enAttente: actifs.filter((p) => p.statut === 'EN_ATTENTE').length,
      annules: participants.filter((p) => p.statut === 'ANNULEE').length,
      presencesValidees: valides.length,
      pointsAttribues: valides.reduce((sum, p) => sum + (p.pointsGagnes ?? 0), 0),
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
      'Statut inscription',
      'Présence validée',
      'Points crédités',
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
      p.presenceValidee ? 'Oui' : 'Non',
      p.presenceValidee ? String(p.pointsGagnes ?? 0) : '0',
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
      CONFIRMEE: 'Inscrit confirmé',
      EN_ATTENTE: 'Liste d\'attente',
      ANNULEE: 'Désinscrit'
    };
    return labels[statut] || statut;
  }
}
