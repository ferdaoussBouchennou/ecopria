import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiService } from '../../core/services/ui.user.service';
import { Profile, PointHistory, UserBadge, LeaderboardEntry, UpcomingAction } from '../../core/models/user.model';

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
  badges: UserBadge[] = [];
  leaderboard: LeaderboardEntry[] = [];
  upcomingActions: UpcomingAction[] = [];
  unreadCount = 0;

  constructor(
    private userSvc: UserService,
    private notifSvc: NotificationService,
    private uiSvc: UiService
  ) {}

  ngOnInit() {
    this.userSvc.getProfile(this.userId).subscribe({
      next: p => {
        this.profile = p;
        this.uiSvc.setPageHeader('Votre printemps engagé', `BONJOUR ${p.firstName}`);
      },
      error: () => {
        this.profile = {
          id: 1, userId: 1, firstName: 'Camille', lastName: 'Renard', 
          totalPoints: 1240, level: 4, createdAt: '', city: 'Paris',
          photo: 'https://i.pravatar.cc/150?u=camille'
        };
        this.uiSvc.setPageHeader('Votre printemps engagé', 'BONJOUR CAMILLE');
      }
    });

    this.userSvc.getHistory(this.userId).subscribe(h => this.history = h);
    this.userSvc.getBadges(this.userId).subscribe(b => this.badges = b);
    this.userSvc.getLeaderboard(this.userId).subscribe(l => this.leaderboard = l);
    this.userSvc.getUpcomingActions().subscribe(a => this.upcomingActions = a);
    
    this.notifSvc.unreadCount$.subscribe(count => this.unreadCount = count);
  }

  getMyRank(): number | undefined {
    return this.leaderboard.find(e => e.isMe)?.rank;
  }
}