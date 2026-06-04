import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Profile } from '../../../core/models/user.model';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-espace-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './espace-shell.component.html',
  styleUrl: './espace-shell.component.scss'
})
export class EspaceShellComponent implements OnInit {
  userId = 0;
  profile?: Profile;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  showNotifs = false;
  notifTab: 'recent' | 'history' = 'recent';
  pageTitle = '';
  pageEyebrow = '';

  constructor(
    private userSvc: UserService,
    private profileSvc: UserProfileService,
    private notifSvc: NotificationService,
    private uiSvc: UiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    try {
      this.userId = this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }

    this.profileSvc.loadProfile();
    this.profileSvc.profile$.subscribe((p) => {
      this.profile = p ?? undefined;
      if (p) {
        this.refreshNotifs();
        this.notifSvc.loadUnreadCount(this.userId);
      }
    });

    this.notifSvc.unreadCount$.subscribe(count => this.unreadCount = count);
    // refreshNotifs/loadUnreadCount are triggered once profile is available

    // Sync Header
    this.uiSvc.currentTitle$.subscribe(title => this.pageTitle = title);
    this.uiSvc.currentEyebrow$.subscribe(eyebrow => this.pageEyebrow = eyebrow);
  }

  refreshNotifs() {
    this.notifSvc.getAll(this.userId).subscribe((n: AppNotification[]) => {
      // Safety: if backend returns more than requested, keep only current user
      this.notifications = n.filter(item => item.userId === this.userId);
    });
  }

  toggleNotifs() {
    this.showNotifs = !this.showNotifs;
  }

  markAsRead(id: number) {
    this.notifSvc.markAsRead(id).subscribe(() => this.refreshNotifs());
  }

  markAllRead() {
    this.notifSvc.markAllAsRead(this.userId).subscribe(() => this.refreshNotifs());
  }

  get filteredNotifs(): AppNotification[] {
    if (this.notifTab === 'recent') {
      return this.notifications.filter(n => !n.isRead);
    } else {
      return this.notifications.filter(n => n.isRead);
    }
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/connexion']);
  }
}
