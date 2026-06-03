import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ActionRowViewModel, ActionSummary } from '../../action/models/action.model';
import { ActionService } from '../../action/services/action.service';
import { InscriptionService } from '../../inscription/inscription.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { MonInscriptionDto } from '../../inscription/models/inscription.model';

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actions.component.html',
  styleUrl: '../styles/user-space.scss'
})
export class ActionsComponent implements OnInit {
  readonly pageSize = 3;

  allUpcoming: ActionRowViewModel[] = [];
  allHistory: ActionRowViewModel[] = [];

  historySearch = '';
  historyStatus: 'ALL' | 'VALIDE' | 'ABSENT' = 'ALL';
  
  currentPageUpcoming = 1;
  currentPageHistory = 1;

  loading = true;
  errorMessage = '';

  constructor(
    private readonly actionService: ActionService,
    private readonly inscriptionService: InscriptionService,
    private readonly uiService: UiService,
    private readonly auth: AuthService
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    this.uiService.setPageHeader('Mes actions', 'ESPACE ENGAGÉ');
    this.loadActions();
  }

  private loadActions(): void {
    this.loading = true;
    this.inscriptionService.getMesActions(this.userId).pipe(
      switchMap((inscriptions) => {
        if (!inscriptions.length) {
          return of([] as ActionRowViewModel[]);
        }

        return forkJoin(inscriptions.map((inscription) =>
          this.actionService.getActionById(inscription.actionId).pipe(
            map((action) => this.toRow(action, inscription))
          )
        ));
      })
    ).subscribe({
      next: (rows) => {
        this.allUpcoming = rows
          .filter((row) => row.statut === 'INSCRIT')
          .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
        
        this.allHistory = rows
          .filter((row) => row.statut !== 'INSCRIT')
          .sort((a, b) => b.dateStart.localeCompare(a.dateStart));

        this.currentPageUpcoming = 1;
        this.currentPageHistory = 1;
        
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger mes actions pour le moment.';
        this.loading = false;
      }
    });
  }

  get upcomingActions(): ActionRowViewModel[] {
    const start = (this.currentPageUpcoming - 1) * this.pageSize;
    return this.allUpcoming.slice(start, start + this.pageSize);
  }

  get historyActions(): ActionRowViewModel[] {
    const start = (this.currentPageHistory - 1) * this.pageSize;
    return this.filteredHistory.slice(start, start + this.pageSize);
  }

  get totalPagesUpcoming(): number {
    return Math.ceil(this.allUpcoming.length / this.pageSize);
  }

  get totalPagesHistory(): number {
    return Math.ceil(this.filteredHistory.length / this.pageSize);
  }

  changePageUpcoming(page: number): void {
    this.currentPageUpcoming = page;
  }

  changePageHistory(page: number): void {
    this.currentPageHistory = page;
  }

  onHistoryFiltersChanged(): void {
    this.currentPageHistory = 1;
  }

  get filteredHistory(): ActionRowViewModel[] {
    const q = this.historySearch.trim().toLowerCase();
    return this.allHistory.filter((row) => {
      const statusOk = this.historyStatus === 'ALL' ? true : row.statut === this.historyStatus;
      if (!statusOk) return false;
      if (!q) return true;

      const haystack = `${row.title} ${row.city} ${row.categoryName} ${row.associationName ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  private toRow(action: ActionSummary, inscription: MonInscriptionDto): ActionRowViewModel {
    return {
      inscriptionId: inscription.inscriptionId,
      actionId: inscription.actionId,
      statut: inscription.statut,
      dateAction: inscription.dateAction,
      title: action.title,
      categoryName: action.categoryName,
      categoryImageUrl: action.categoryImageUrl,
      city: action.city,
      dateStart: action.dateStart,
      dateEnd: action.dateEnd,
      points: action.points,
      availablePlaces: action.availablePlaces,
      maxParticipants: action.maxParticipants,
      associationName: action.associationName,
      description: undefined
    };
  }

  get statusCount(): number {
    return this.upcomingActions.length + this.historyActions.length;
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'INSCRIT':
        return 'Inscrit';
      case 'VALIDE':
        return 'Validé';
      case 'ABSENT':
        return 'Absent';
      default:
        return statut;
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'INSCRIT':
        return 'is-inscrit';
      case 'VALIDE':
        return 'is-valide';
      case 'ABSENT':
        return 'is-absent';
      default:
        return '';
    }
  }

  formatDateRange(start: string, end: string): string {
    if (!start) {
      return 'Date à confirmer';
    }

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const dateText = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(startDate);

    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return dateText;
    }

    return `${dateText} · ${new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(startDate)} - ${new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(endDate)}`;
  }
}
