import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Participant, ParticipantsStats } from '../models/participant.model';
import { InscriptionResponse } from '../../inscription/models/inscription.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantsService {
  private readonly API_INSCRIPTIONS = '/api/inscriptions';
  private readonly API_USERS = '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste complète des participants d'une action
   * avec leurs détails utilisateur
   */
  getParticipants(actionId: number): Observable<Participant[]> {
    return this.http.get<InscriptionResponse[]>(`${this.API_INSCRIPTIONS}/action/${actionId}`)
      .pipe(
        map(inscriptions => {
          // Pour l'instant, on retourne les inscriptions sans détails utilisateur
          // TODO: Faire des appels pour récupérer les détails de chaque utilisateur
          return inscriptions.map(inscription => ({
            inscriptionId: inscription.id,
            userId: inscription.userId,
            actionId: inscription.actionId,
            dateInscription: inscription.dateInscription,
            statut: inscription.statut,
            pointsAction: inscription.pointsAction,
            // Données mockées en attendant l'endpoint utilisateur
            firstName: `Utilisateur`,
            lastName: `#${inscription.userId}`,
            email: `user${inscription.userId}@example.com`,
            phone: '06XXXXXXXX',
            photoUrl: undefined,
            city: 'Ville inconnue'
          }));
        }),
        catchError(error => {
          console.error('Erreur récupération participants:', error);
          return of([]);
        })
      );
  }

  /**
   * Calcule les statistiques des participants
   */
  calculateStats(participants: Participant[]): ParticipantsStats {
    return {
      total: participants.length,
      confirmes: participants.filter(p => p.statut === 'CONFIRMEE').length,
      enAttente: participants.filter(p => p.statut === 'EN_ATTENTE').length,
      annules: participants.filter(p => p.statut === 'ANNULEE').length
    };
  }

  /**
   * Exporte la liste des participants en CSV
   */
  exportToCSV(participants: Participant[], actionTitle: string): void {
    // En-têtes CSV
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Ville', 'Date inscription', 'Statut', 'Points'];
    
    // Données
    const rows = participants.map(p => [
      p.lastName || '',
      p.firstName || '',
      p.email || '',
      p.phone || '',
      p.city || '',
      this.formatDate(p.dateInscription),
      this.getStatutLabel(p.statut),
      p.pointsAction.toString()
    ]);

    // Construction du CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Téléchargement
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
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
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
      'CONFIRMEE': 'Confirmé',
      'EN_ATTENTE': 'En attente',
      'ANNULEE': 'Annulé'
    };
    return labels[statut] || statut;
  }
}
