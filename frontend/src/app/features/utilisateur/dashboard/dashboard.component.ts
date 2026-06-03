import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Profile, PointHistory, UserBadge, LeaderboardEntry, UpcomingAction } from '../../../core/models/user.model';
import { ActionService } from '../../action/services/action.service';

interface DashboardBadgeCard {
  name: string;
  description: string;
  icon: string;
  locked: boolean;
}

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
  badges: UserBadge[] = [];
  leaderboard: LeaderboardEntry[] = [];
  upcomingActions: UpcomingAction[] = [];
  totalUpcomingActions = 0;
  unreadCount = 0;
  readonly fallbackBadges: DashboardBadgeCard[] = [
    { name: 'Premier Pas', description: 'Premiere action validee', icon: '●', locked: false },
    { name: 'Nettoyeur', description: '3 actions de nettoyage', icon: '●', locked: false },
    { name: 'Reboiseur', description: '2 plantations validees', icon: '●', locked: true },
    { name: 'Fidele', description: '5 actions au total', icon: '●', locked: false },
    { name: 'Champion du Mois', description: 'Top 1 mensuel', icon: '●', locked: true }
  ];

  constructor(
    private userSvc: UserService,
    private notifSvc: NotificationService,
    private uiSvc: UiService,
    private actionSvc: ActionService,
    private auth: AuthService
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit() {
    this.userSvc.getProfile(this.userId).subscribe({
      next: (p) => {
        this.profile = p;
        this.uiSvc.setPageHeader('Votre printemps engagé', `BONJOUR ${p.firstName}`);
      },
      error: () => {
        this.uiSvc.setPageHeader('Votre printemps engagé', 'BONJOUR');
      }
    });

    this.userSvc.getHistory(this.userId).subscribe((h) => {
      this.totalPointHistory = h.length;
      this.history = h.slice(0, 3);
    });
    this.userSvc.getBadges(this.userId).subscribe((b) => this.badges = b);
    this.userSvc.getLeaderboard(this.userId).subscribe((l) => this.leaderboard = l);
    this.actionSvc.getActions().pipe(
      map((actions) => {
        this.totalUpcomingActions = actions.length;
        return actions.slice(0, 3).map((action) => ({
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
        } as UpcomingAction));
      })
    ).subscribe({
      next: (a) => this.upcomingActions = a,
      error: () => {
        this.totalUpcomingActions = 0;
        this.upcomingActions = [];
      }
    });
    
    this.notifSvc.unreadCount$.subscribe((count) => this.unreadCount = count);
  }

  getMyRank(): number | undefined {
    return this.leaderboard.find((e) => e.isMe)?.rank;
  }

  get validatedActionsCount(): number {
    return this.history.filter((entry) => entry.type === 'CREDIT').length;
  }

  get displayBadges(): DashboardBadgeCard[] {
    if (this.badges.length) {
      const realBadges = this.badges.slice(0, 5).map((userBadge) => ({
        name: userBadge.badge.name,
        description: userBadge.badge.description,
        icon: userBadge.badge.icon || '●',
        locked: false
      }));

      if (realBadges.length >= 5) {
        return realBadges;
      }

      return [...realBadges, ...this.fallbackBadges.slice(realBadges.length, 5)];
    }

    return this.fallbackBadges;
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
