import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AssociationService } from '../services/association.service';
import { ActionSummary } from '../../action/models/action.model';

interface ActionWithParticipants extends ActionSummary {
  participantsCount: number;
}

@Component({
  selector: 'app-liste-participants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-participants.component.html',
  styleUrls: ['./liste-participants.component.scss']
})
export class ListeParticipantsComponent implements OnInit {
  actions: ActionWithParticipants[] = [];
  searchTerm = '';
  statusFilter = 'TOUS';
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

    this.associationService.getMesActions().pipe(
      catchError((err) => {
        console.error('Erreur lors du chargement des actions (participants):', err);
        return of([] as ActionSummary[]);
      })
    ).subscribe({
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

  get filteredActions(): ActionWithParticipants[] {
    return this.actions.filter((action) => {
      const matchesSearch = !this.searchTerm.trim()
        || action.title.toLowerCase().includes(this.searchTerm.toLowerCase())
        || (action.city ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === 'TOUS' || action.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  get totalParticipants(): number {
    return this.actions.reduce((sum, action) => sum + action.participantsCount, 0);
  }

  get publishedActions(): number {
    return this.actions.filter((action) => action.status === 'PUBLISHED').length;
  }

  get upcomingActions(): number {
    const now = Date.now();
    return this.actions.filter((action) => new Date(action.dateEnd).getTime() >= now).length;
  }

  getFillRate(action: ActionWithParticipants): number {
    if (!action.maxParticipants) {
      return 0;
    }
    return Math.min(100, Math.round((action.participantsCount / action.maxParticipants) * 100));
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
