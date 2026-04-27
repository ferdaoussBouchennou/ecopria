import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiService } from '../../core/services/ui.user.service';
import { Profile } from '../../core/models/user.model';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-espace-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './espace-shell.component.html'
})
export class EspaceShellComponent implements OnInit {
  profile?: Profile;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  showNotifs = false;
  notifTab: 'recent' | 'history' = 'recent';
  pageTitle = '';
  pageEyebrow = '';

  constructor(
    private userSvc: UserService,
    private notifSvc: NotificationService,
    private uiSvc: UiService
  ) { }

  ngOnInit() {
    this.userSvc.getProfile(1).subscribe({
      next: (p) => this.profile = p,
      error: () => {
        this.profile = {
          id: 1, userId: 1, firstName: 'Camille', lastName: 'Renard',
          totalPoints: 1240, level: 4, createdAt: '', city: 'Paris',
          photo: 'assets/upload/user/profil/1.jpg'
        };
      }
    });

    this.notifSvc.unreadCount$.subscribe(count => this.unreadCount = count);
    this.notifSvc.loadUnreadCount(1);
    this.refreshNotifs();

    // Sync Header
    this.uiSvc.currentTitle$.subscribe(title => this.pageTitle = title);
    this.uiSvc.currentEyebrow$.subscribe(eyebrow => this.pageEyebrow = eyebrow);
  }

  refreshNotifs() {
    this.notifSvc.getAll(1).subscribe((n: AppNotification[]) => this.notifications = n);
  }

  toggleNotifs() {
    this.showNotifs = !this.showNotifs;
  }

  markAsRead(id: number) {
    this.notifSvc.markAsRead(id).subscribe(() => this.refreshNotifs());
  }

  markAllRead() {
    this.notifSvc.markAllAsRead(1).subscribe(() => this.refreshNotifs());
  }

  get filteredNotifs(): AppNotification[] {
    if (this.notifTab === 'recent') {
      return this.notifications.filter(n => !n.isRead);
    } else {
      return this.notifications.filter(n => n.isRead);
    }
  }
}
