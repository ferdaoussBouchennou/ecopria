import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiService } from '../../core/services/ui.user.service';
import { Profile, PointHistory, UserBadge, LeaderboardEntry, UpcomingAction } from '../../core/models/user.model';
import { ActionService } from '../../core/services/action.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  readonly userId = 1;

  profile?: Profile;
  history: PointHistory[] = [];
  totalPointHistory = 0;
  badges: UserBadge[] = [];
  leaderboard: LeaderboardEntry[] = [];
  upcomingActions: UpcomingAction[] = [];
  totalUpcomingActions = 0;
  unreadCount = 0;

  constructor(
    private userSvc: UserService,
    private notifSvc: NotificationService,
    private uiSvc: UiService,
    private actionSvc: ActionService
  ) {}

  ngOnInit() {
    this.userSvc.getProfile(this.userId).subscribe({
      next: p => {
        this.profile = p;
        this.uiSvc.setPageHeader('Votre printemps engagé', `BONJOUR ${p.firstName}`);
      },
      error: () => {
        this.uiSvc.setPageHeader('Votre printemps engagé', 'BONJOUR');
      }
    });

    this.userSvc.getHistory(this.userId).subscribe(h => {
      this.totalPointHistory = h.length;
      this.history = h.slice(0, 3);
    });
    this.userSvc.getBadges(this.userId).subscribe(b => this.badges = b);
    this.userSvc.getLeaderboard(this.userId).subscribe(l => this.leaderboard = l);
    this.actionSvc.getAll().pipe(
      map(actions => {
        this.totalUpcomingActions = actions.length;
        return actions.slice(0, 3).map(action => ({
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
    
    this.notifSvc.unreadCount$.subscribe(count => this.unreadCount = count);
  }

  getMyRank(): number | undefined {
    return this.leaderboard.find(e => e.isMe)?.rank;
  }
}