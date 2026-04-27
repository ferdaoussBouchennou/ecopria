import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { UiService } from '../../core/services/ui.user.service';
import { LeaderboardEntry } from '../../core/models/user.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html'
})
export class LeaderboardComponent implements OnInit {
  leaderboard: LeaderboardEntry[] = [];

  constructor(
    private userSvc: UserService,
    private uiSvc: UiService
  ) { }

  ngOnInit() {
    this.uiSvc.setPageHeader('Classement Ecopria', 'CHAMPIONNE DU MOIS');
    this.userSvc.getLeaderboard(1).subscribe(data => this.leaderboard = data);
  }
}