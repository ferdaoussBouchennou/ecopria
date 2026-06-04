import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AssociationService, AssociationStats } from '../services/association.service';
import { AssociationUiService } from '../services/association-ui.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { ActionSummary } from '../../action/models/action.model';
import { formatNaiveTime, parseNaiveDateTime } from '../../../core/utils/datetime-local.util';

type ActionView = 'upcoming' | 'history' | 'drafts' | 'cancelled';

@Component({
  selector: 'app-mes-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-actions.component.html',
  styleUrls: ['./mes-actions.component.css']
})
export class MesActionsComponent implements OnInit {
  readonly viewOptions: ActionView[] = ['upcoming', 'history', 'drafts', 'cancelled'];
  allActions: ActionSummary[] = [];
  brouillons: ActionSummary[] = [];
  globalStats: AssociationStats | null = null;
  loading = true;
  error: string | null = null;
  selectedView: ActionView = 'upcoming';
  currentPage = 1;
  readonly pageSize = 4;

  constructor(
    private associationService: AssociationService,
    private router: Router,
    private ui: AssociationUiService
  ) {}

  ngOnInit(): void {
    this.loadActions();
  }

  loadActions(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      actions: this.associationService.getMesActions().pipe(
        catchError((err) => {
          console.error('Erreur chargement actions:', err);
          return of([] as ActionSummary[]);
        })
      ),
      drafts: this.associationService.getMesBrouillons().pipe(
        catchError((err) => {
          console.error('Erreur chargement brouillons:', err);
          return of([] as ActionSummary[]);
        })
      ),
      stats: this.associationService.getMesStats().pipe(
        catchError((err) => {
          console.error('Erreur chargement statistiques:', err);
          return of(null);
        })
      )
    }).subscribe({
      next: ({ actions, drafts, stats }) => {
        this.allActions = this.sortByDate(actions);
        const fallbackDrafts = this.sortByDate(
          this.allActions.filter((action) => action.status === 'DRAFT')
        );
        this.brouillons = drafts.length > 0 ? this.sortByDate(drafts) : fallbackDrafts;
        this.globalStats = stats;
        this.selectedView = this.getDefaultView();
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        this.error = httpErrorMessage(
          err,
          'Impossible de charger les actions. Démarrez service-action (9090) et exécutez seed-dev-data.sql (db_action.associations, user_id=1).'
        );
        this.loading = false;
        console.error(err);
      }
    });
  }

  setSelectedView(view: ActionView): void {
    this.selectedView = view;
    this.currentPage = 1;
  }

  creerAction(): void {
    this.router.navigate(['/association/creer']);
  }

  modifierAction(actionId: number): void {
    this.router.navigate(['/association/modifier', actionId]);
  }

  voirDetails(actionId: number): void {
    this.router.navigate(['/association/action', actionId]);
  }

  publierBrouillon(actionId: number): void {
    this.ui.confirm({
      title: 'Publier l\'action',
      message: 'Voulez-vous publier cette action ? Elle sera visible par tous les utilisateurs.',
      confirmLabel: 'Publier'
    }).subscribe((ok) => {
      if (!ok) return;
      this.associationService.publierAction(actionId).subscribe({
        next: () => {
          this.ui.toast('Action publiée avec succès.', 'success');
          this.loadActions();
        },
        error: (err) => {
          this.ui.toast('Erreur lors de la publication.', 'error');
          console.error(err);
        }
      });
    });
  }

  annulerAction(actionId: number): void {
    this.ui.prompt({
      title: 'Annuler l\'action',
      message: 'Motif obligatoire — un e-mail sera envoyé à tous les inscrits avec ce motif.',
      placeholder: 'Ex. : conditions météo défavorables…',
      required: true,
      confirmLabel: 'Continuer'
    }).subscribe((raison) => {
      if (raison === null) return;
      const trimmed = raison.trim();
      this.ui.confirm({
        title: 'Confirmer l\'annulation',
        message: 'Tous les inscrits seront notifiés par e-mail. Cette action est irréversible.',
        confirmLabel: 'Annuler l\'action',
        danger: true
      }).subscribe((ok) => {
        if (!ok) return;
        this.associationService.annulerAction(actionId, trimmed).subscribe({
          next: () => {
            this.ui.toast('Action annulée. Les participants ont été notifiés.', 'success');
            this.loadActions();
          },
          error: (err) => {
            const msg = err?.error?.message || 'Erreur lors de l\'annulation';
            this.ui.toast(msg, 'error');
            console.error(err);
          }
        });
      });
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(dateStr: string): string {
    return formatNaiveTime(dateStr);
  }

  formatDateRange(action: ActionSummary): string {
    const start = parseNaiveDateTime(action.dateStart);
    const end = parseNaiveDateTime(action.dateEnd);

    if (start.toDateString() === end.toDateString()) {
      return `${this.formatDate(action.dateStart)} · ${this.formatTime(action.dateStart)} - ${this.formatTime(action.dateEnd)}`;
    }

    return `${this.formatDate(action.dateStart)} - ${this.formatDate(action.dateEnd)}`;
  }

  getActionImage(action: ActionSummary): string {
    if (action.photoUrls && action.photoUrls.length > 0) {
      return action.photoUrls[0];
    }
    return action.categoryImageUrl || '/assets/placeholder-action.jpg';
  }

  getViewCount(view: ActionView): number {
    switch (view) {
      case 'upcoming':
        return this.upcomingActions.length;
      case 'history':
        return this.historyActions.length;
      case 'drafts':
        return this.brouillons.length;
      case 'cancelled':
        return this.cancelledActions.length;
      default:
        return 0;
    }
  }

  getViewLabel(view: ActionView): string {
    switch (view) {
      case 'upcoming':
        return 'À venir';
      case 'history':
        return 'Historique';
      case 'drafts':
        return 'Brouillons';
      case 'cancelled':
        return 'Annulées';
      default:
        return '';
    }
  }

  getSectionTitle(): string {
    switch (this.selectedView) {
      case 'upcoming':
        return 'Actions à piloter';
      case 'history':
        return 'Historique des actions';
      case 'drafts':
        return 'Brouillons à finaliser';
      case 'cancelled':
        return 'Actions annulées';
      default:
        return 'Mes actions';
    }
  }

  getSectionDescription(): string {
    switch (this.selectedView) {
      case 'upcoming':
        return 'Suivez les inscriptions, identifiez les actions prioritaires et intervenez rapidement.';
      case 'history':
        return 'Retrouvez vos actions passées et mesurez l’engagement déjà généré.';
      case 'drafts':
        return 'Complétez, relisez et publiez vos prochaines actions.';
      case 'cancelled':
        return 'Gardez une trace des actions retirées de la programmation.';
      default:
        return '';
    }
  }

  getEmptyTitle(): string {
    switch (this.selectedView) {
      case 'upcoming':
        return 'Aucune action à venir';
      case 'history':
        return 'Pas encore d’historique';
      case 'drafts':
        return 'Aucun brouillon';
      case 'cancelled':
        return 'Aucune action annulée';
      default:
        return 'Aucune action';
    }
  }

  getEmptyDescription(): string {
    switch (this.selectedView) {
      case 'upcoming':
        return 'Créez une nouvelle action ou publiez un brouillon pour lancer votre prochaine mobilisation.';
      case 'history':
        return 'Vos actions terminées apparaîtront ici pour suivre votre progression dans le temps.';
      case 'drafts':
        return 'Commencez une nouvelle fiche action et retrouvez-la ici tant qu’elle n’est pas publiée.';
      case 'cancelled':
        return 'Les actions annulées s’affichent ici pour garder un historique complet.';
      default:
        return '';
    }
  }

  get filteredActions(): ActionSummary[] {
    switch (this.selectedView) {
      case 'upcoming':
        return this.upcomingActions;
      case 'history':
        return this.historyActions;
      case 'drafts':
        return this.brouillons;
      case 'cancelled':
        return this.cancelledActions;
      default:
        return [];
    }
  }

  get paginatedActions(): ActionSummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredActions.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredActions.length / this.pageSize));
  }

  get paginationLabel(): string {
    if (this.filteredActions.length === 0) {
      return '0 action';
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredActions.length);
    return `${start}-${end} sur ${this.filteredActions.length} actions`;
  }

  get agendaAction(): ActionSummary | null {
    if (this.upcomingActions.length > 0) {
      return this.upcomingActions[0];
    }
    if (this.brouillons.length > 0) {
      return this.brouillons[0];
    }
    if (this.historyActions.length > 0) {
      return [...this.historyActions].sort(
        (a, b) => parseNaiveDateTime(b.dateStart).getTime() - parseNaiveDateTime(a.dateStart).getTime()
      )[0];
    }
    return null;
  }

  get agendaMode(): 'upcoming' | 'draft' | 'history' | 'empty' {
    if (this.upcomingActions.length > 0) {
      return 'upcoming';
    }
    if (this.brouillons.length > 0) {
      return 'draft';
    }
    if (this.historyActions.length > 0) {
      return 'history';
    }
    return 'empty';
  }

  get agendaEyebrow(): string {
    switch (this.agendaMode) {
      case 'upcoming':
        return 'Prochaine action';
      case 'draft':
        return 'Brouillon à publier';
      case 'history':
        return 'Dernière action réalisée';
      default:
        return 'Agenda association';
    }
  }

  get agendaTitle(): string {
    if (this.agendaAction) {
      return this.agendaAction.title;
    }
    return 'Votre agenda est libre';
  }

  get agendaDescription(): string {
    switch (this.agendaMode) {
      case 'upcoming':
        return `${this.formatDateRange(this.agendaAction!)} · ${this.agendaAction!.city}`;
      case 'draft':
        return 'Ce brouillon est prêt à être complété puis publié pour devenir votre prochaine mobilisation.';
      case 'history':
        return `Dernière action menée le ${this.formatDate(this.agendaAction!.dateStart)}. Préparez la suivante pour maintenir la dynamique.`;
      default:
        return 'Planifiez une nouvelle action ou publiez un brouillon pour relancer la mobilisation.';
    }
  }

  get agendaSecondaryInfo(): string {
    if (!this.agendaAction) {
      return `${this.totalPublishedActions} action(s) déjà organisée(s)`;
    }

    switch (this.agendaMode) {
      case 'upcoming':
        return this.hasCapacity(this.agendaAction)
          ? `${this.getFillRate(this.agendaAction)}% de remplissage`
          : 'Action fixe en programmation';
      case 'draft':
        return `${this.brouillons.length} brouillon(s) en attente`;
      case 'history':
        return `${this.agendaAction.registeredCount} participant(s) mobilisé(s)`;
      default:
        return '';
    }
  }

  get agendaActionLabel(): string {
    switch (this.agendaMode) {
      case 'upcoming':
      case 'history':
        return 'Voir les détails';
      case 'draft':
        return 'Continuer le brouillon';
      default:
        return 'Créer une action';
    }
  }

  get upcomingActions(): ActionSummary[] {
    return this.sortByDate(
      this.allActions.filter(
        (action) => action.status === 'PUBLISHED' && !this.isPast(action)
      )
    );
  }

  get historyActions(): ActionSummary[] {
    return this.sortByDate(
      this.allActions.filter(
        (action) => action.status === 'COMPLETED' || (action.status === 'PUBLISHED' && this.isPast(action))
      )
    );
  }

  get cancelledActions(): ActionSummary[] {
    return this.sortByDate(
      this.allActions.filter((action) => action.status === 'CANCELLED')
    );
  }

  get nextAction(): ActionSummary | null {
    return this.upcomingActions[0] ?? null;
  }

  get urgentActionsCount(): number {
    return this.upcomingActions.filter((action) => this.isActionUrgent(action)).length;
  }

  get totalPublishedActions(): number {
    if (this.globalStats) {
      return this.globalStats.totalPublished;
    }

    return this.allActions.filter(
      (action) => action.status === 'PUBLISHED' || action.status === 'COMPLETED'
    ).length;
  }

  get totalMobilizedParticipants(): number {
    if (this.globalStats) {
      return this.globalStats.totalParticipants;
    }

    return this.allActions.reduce((sum, action) => sum + (action.registeredCount ?? 0), 0);
  }

  get totalPointsCredited(): number {
    if (this.globalStats) {
      return this.globalStats.totalPoints;
    }

    return this.allActions.reduce(
      (sum, action) => sum + (action.pointsCredited ?? 0),
      0
    );
  }

  getAverageFillRate(): number {
    const withCapacity = this.upcomingActions.filter((action) => this.hasCapacity(action));
    if (withCapacity.length === 0) {
      return 0;
    }

    const total = withCapacity.reduce((sum, action) => sum + this.getFillRate(action), 0);
    return Math.round(total / withCapacity.length);
  }

  getMonthActionsCount(): number {
    const now = new Date();
    return this.upcomingActions.filter((action) => {
      const start = parseNaiveDateTime(action.dateStart);
      return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
    }).length;
  }

  getRemainingPlacesTotal(): number {
    return this.upcomingActions.reduce((sum, action) => {
      const remaining = this.getRemainingPlaces(action);
      return remaining === null ? sum : sum + remaining;
    }, 0);
  }

  getFillRate(action: ActionSummary): number {
    if (!this.hasCapacity(action)) {
      return 0;
    }

    return Math.min(100, Math.round(((action.registeredCount ?? 0) / action.maxParticipants) * 100));
  }

  getRemainingPlaces(action: ActionSummary): number | null {
    if (!this.hasCapacity(action)) {
      return null;
    }

    if (typeof action.availablePlaces === 'number') {
      return Math.max(0, action.availablePlaces);
    }

    return Math.max(0, action.maxParticipants - (action.registeredCount ?? 0));
  }

  getCapacityLabel(action: ActionSummary): string {
    if (!this.hasCapacity(action)) {
      return 'Action fixe';
    }

    const remaining = this.getRemainingPlaces(action) ?? 0;
    if (remaining === 0) {
      return 'Complet';
    }
    if (remaining === 1) {
      return '1 place restante';
    }
    return `${remaining} places restantes`;
  }

  getStatusLabel(action: ActionSummary): string {
    if (action.status === 'DRAFT') {
      return 'Brouillon';
    }
    if (action.status === 'CANCELLED') {
      return 'Annulée';
    }
    if (action.status === 'COMPLETED' || this.isPast(action)) {
      return 'Terminée';
    }
    if (this.isActionUrgent(action)) {
      return 'Prioritaire';
    }
    if (this.hasCapacity(action) && this.getFillRate(action) === 100) {
      return 'Complet';
    }
    return 'Publiée';
  }

  getStatusClass(action: ActionSummary): string {
    if (action.status === 'DRAFT') {
      return 'status-draft';
    }
    if (action.status === 'CANCELLED') {
      return 'status-cancelled';
    }
    if (action.status === 'COMPLETED' || this.isPast(action)) {
      return 'status-completed';
    }
    if (this.isActionUrgent(action)) {
      return 'status-urgent';
    }
    return 'status-published';
  }

  getTimelineLabel(action: ActionSummary): string {
    if (action.status === 'CANCELLED') {
      return 'Action retirée de la programmation';
    }
    if (action.status === 'COMPLETED' || this.isPast(action)) {
      return 'Action déjà réalisée';
    }

    const start = parseNaiveDateTime(action.dateStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((startDay.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) {
      return `Aujourd'hui à ${this.formatTime(action.dateStart)}`;
    }
    if (diffDays === 1) {
      return `Demain à ${this.formatTime(action.dateStart)}`;
    }
    if (diffDays > 1 && diffDays <= 7) {
      return `Dans ${diffDays} jours`;
    }
    return `Prévue le ${this.formatDate(action.dateStart)}`;
  }

  hasCapacity(action: ActionSummary): boolean {
    return !action.isFixed && action.maxParticipants > 0;
  }

  isActionUrgent(action: ActionSummary): boolean {
    return action.status === 'PUBLISHED' && !this.isPast(action) && this.hasCapacity(action) && this.getFillRate(action) >= 80;
  }

  canEdit(action: ActionSummary): boolean {
    return action.status === 'DRAFT' || (action.status === 'PUBLISHED' && !this.isPast(action));
  }

  canCancel(action: ActionSummary): boolean {
    return action.status === 'PUBLISHED' && !this.isPast(action);
  }

  agendaActionClick(): void {
    if (!this.agendaAction) {
      this.creerAction();
      return;
    }

    if (this.agendaMode === 'draft') {
      this.modifierAction(this.agendaAction.id);
      return;
    }

    this.voirDetails(this.agendaAction.id);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  trackByActionId(_: number, action: ActionSummary): number {
    return action.id;
  }

  private isPast(action: ActionSummary): boolean {
    return new Date(action.dateEnd).getTime() < Date.now();
  }

  private sortByDate(actions: ActionSummary[]): ActionSummary[] {
    return [...actions].sort(
      (a, b) => parseNaiveDateTime(a.dateStart).getTime() - parseNaiveDateTime(b.dateStart).getTime()
    );
  }

  private getDefaultView(): ActionView {
    if (this.upcomingActions.length > 0) {
      return 'upcoming';
    }
    if (this.brouillons.length > 0) {
      return 'drafts';
    }
    if (this.historyActions.length > 0) {
      return 'history';
    }
    if (this.cancelledActions.length > 0) {
      return 'cancelled';
    }
    return 'upcoming';
  }
}
