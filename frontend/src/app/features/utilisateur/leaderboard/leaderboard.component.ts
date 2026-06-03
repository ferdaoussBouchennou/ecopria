import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { LeaderboardEntry } from '../../../core/models/user.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: '../styles/user-space.scss'
})
export class LeaderboardComponent implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  readonly pageSize = 10;
  currentPage = 1;

  constructor(
    private userSvc: UserService,
    private uiSvc: UiService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.uiSvc.setPageHeader('Classement Ecopria', 'CHAMPIONNE DU MOIS');
    this.userSvc.getLeaderboard(this.auth.requireUserId()).subscribe((data) => {
      this.leaderboard = data;
      this.currentPage = 1;
    });
  }

  get pagedLeaderboard(): LeaderboardEntry[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.leaderboard.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.leaderboard.length / this.pageSize);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }
}
