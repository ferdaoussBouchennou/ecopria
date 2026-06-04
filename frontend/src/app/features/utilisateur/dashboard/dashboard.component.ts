import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Profile, PointHistory, BadgeStatus, UpcomingAction } from '../../../core/models/user.model';
import { ActionService } from '../../action/services/action.service';
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
        const upcoming = inscriptions.filter((i) => i.statut === 'INSCRIT');
        this.totalUpcomingActions = upcoming.length;
        if (!upcoming.length) {
          return of([] as UpcomingAction[]);
        }

        return forkJoin(
          upcoming.map((inscription) =>
            this.actionSvc.getActionById(inscription.actionId).pipe(
              map((action) => ({ action, sortKey: action.dateStart }))
            )
          )
        ).pipe(
          map((rows) =>
            rows
              .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
              .map(({ action }) => ({
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
                imageUrl: action.categoryImageUrl || 'assets/logo.png'
              } as UpcomingAction))
          )
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
}