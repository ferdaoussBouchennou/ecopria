import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Profile, PointHistory, BadgeStatus, UpcomingAction } from '../../../core/models/user.model';
import { ActionService } from '../../action/services/action.service';
import { getActionCardImage } from '../../action/utils/action-image.util';
import { shouldHideParticipantEntry, resolveParticipationStatut } from '../../action/utils/action-participant.util';
import { ActionSummary } from '../../action/models/action.model';
import { InscriptionService } from '../../inscription/inscription.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: '../styles/user-space.scss'
})
export class DashboardComponent implements OnInit {
  profile?: Profile;
  history: PointHistory[] = [];
  totalPointHistory = 0;
  badgeStatuses: BadgeStatus[] = [];
  upcomingActions: UpcomingAction[] = [];
  totalUpcomingActions = 0;
  unreadCount = 0;

  constructor(
    private userSvc: UserService,
    private notifSvc: NotificationService,
    private uiSvc: UiService,
    private actionSvc: ActionService,
    private inscriptionSvc: InscriptionService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    let userId: number;
    try {
      userId = this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }

    this.userSvc.getProfile(userId).subscribe({
      next: (p) => {
        this.profile = p;
        this.uiSvc.setPageHeader('Votre printemps engagé', `BONJOUR ${p.firstName}`);
      },
      error: () => {
        this.uiSvc.setPageHeader('Votre printemps engagé', 'BONJOUR');
      }
    });

    this.userSvc.getHistory(userId).subscribe((h) => {
      this.totalPointHistory = h.length;
      this.history = h.slice(0, 3);
    });

    this.userSvc.getBadgesStatus(userId).subscribe((b) => {
      this.badgeStatuses = b ?? [];
    });

    this.loadUpcomingActions(userId);

    this.notifSvc.unreadCount$.subscribe((count) => (this.unreadCount = count));
  }

  private loadUpcomingActions(userId: number): void {
    this.inscriptionSvc.getMesActions(userId).pipe(
      switchMap((inscriptions) => {
        if (!inscriptions.length) {
          this.totalUpcomingActions = 0;
          return of([] as UpcomingAction[]);
        }

        const actionIds = [...new Set(inscriptions.map((i) => i.actionId))];
        return this.actionSvc.getActionSummariesByIds(actionIds).pipe(
          map((actions) => {
            const byId = new Map(actions.map((a) => [a.id, a]));
            const upcoming = inscriptions.filter((inscription) => {
              const action = byId.get(inscription.actionId);
              if (!action || shouldHideParticipantEntry(inscription.inscriptionStatut, action)) {
                return false;
              }
              return resolveParticipationStatut(inscription.inscriptionStatut, action) === 'INSCRIT';
            });
            this.totalUpcomingActions = upcoming.length;

            return upcoming
              .map((inscription) => byId.get(inscription.actionId)!)
              .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
              .map((action) => this.toUpcomingAction(action));
          })
        );
      })
    ).subscribe({
      next: (actions) => {
        this.upcomingActions = actions.slice(0, 3);
      },
      error: () => {
        this.totalUpcomingActions = 0;
        this.upcomingActions = [];
      }
    });
  }

  get validatedActionsCount(): number {
    return this.history.filter((entry) => entry.type === 'CREDIT').length;
  }

  get unlockedBadgesCount(): number {
    return this.badgeStatuses.filter((badge) => badge.obtained).length;
  }

  getLocationLabel(action: UpcomingAction): string {
    return `${action.location} - ${action.category}`.toUpperCase();
  }

  getActionSchedule(action: UpcomingAction): string {
    return `${this.capitalize(action.date)} · ${action.startTime} — ${action.endTime}`;
  }

  private capitalize(value: string): string {
    if (!value) {
      return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  onActionImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/logo.png';
  }

  private toUpcomingAction(action: ActionSummary): UpcomingAction {
    return {
      id: action.id,
      title: action.title,
      location: action.city,
      category: action.categoryName,
      date: new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(action.dateStart)),
      startTime: new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(action.dateStart)),
      endTime: new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(action.dateEnd)),
      points: action.points,
      imageUrl: getActionCardImage(action)
    };
  }
}