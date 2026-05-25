import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { ActionSummary } from '../../action/models/action.model';

interface ActionWithParticipants extends ActionSummary {
  participantsCount: number;
}

@Component({
  selector: 'app-liste-participants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liste-participants.component.html',
  styleUrls: ['./liste-participants.component.scss']
})
export class ListeParticipantsComponent implements OnInit {
  actions: ActionWithParticipants[] = [];
  loading = true;
  error = '';

  constructor(
    private associationService: AssociationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActions();
  }

  loadActions(): void {
    this.loading = true;
    this.error = '';

    this.associationService.getMesActions().subscribe({
      next: (actions) => {
        this.actions = actions.map(action => ({
          ...action,
          participantsCount: action.registeredCount || 0
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des actions';
        this.loading = false;
        console.error(err);
      }
    });
  }

  voirParticipants(actionId: number): void {
    this.router.navigate(['/association/action', actionId, 'participants']);
  }

  creerAction(): void {
    this.router.navigate(['/association/creer']);
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PUBLISHED': 'status-published',
      'DRAFT': 'status-draft',
      'CANCELLED': 'status-cancelled',
      'COMPLETED': 'status-completed'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PUBLISHED': 'Publiée',
      'DRAFT': 'Brouillon',
      'CANCELLED': 'Annulée',
      'COMPLETED': 'Terminée'
    };
    return labels[status] || status;
  }
}
