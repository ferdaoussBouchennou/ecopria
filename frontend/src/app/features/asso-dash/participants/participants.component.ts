import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PresenceService } from '../../presence/presence.service';
import { ParticipantRow } from '../../../core/models/presence.model';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.css']
})
export class ParticipantsComponent implements OnInit {

  actionId = '';
  participants: ParticipantRow[] = [];
  loading = false;
  erreurMessage = '';

  constructor(private presenceService: PresenceService) {}

  ngOnInit(): void {}

  charger(): void {
    const id = Number(this.actionId);
    if (!id) return;

    this.loading = true;
    this.erreurMessage = '';

    this.presenceService.getParticipants(id).subscribe({
      next: (rows) => {
        this.participants = rows.sort((a, b) => {
          const order: Record<string, number> = {
            CONFIRMEE: 0,
            EN_ATTENTE: 1,
            ANNULEE: 2
          };
          return (order[a.statut] ?? 9) - (order[b.statut] ?? 9);
        });
        this.loading = false;
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.loading = false;
      }
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      CONFIRMEE: 'Inscrit',
      EN_ATTENTE: 'Liste d\'attente',
      ANNULEE: 'Annulé',
      VALIDE: 'Validé',
      ABSENT: 'Absent'
    };
    return labels[statut] ?? statut;
  }

  statutClass(statut: string): string {
    if (statut === 'CONFIRMEE') return 'badge--green';
    if (statut === 'EN_ATTENTE') return 'badge--warning';
    return 'badge--gray';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get confirmes(): number {
    return this.participants.filter((p) => p.statut === 'CONFIRMEE').length;
  }

  get enAttente(): number {
    return this.participants.filter((p) => p.statut === 'EN_ATTENTE').length;
  }
}
