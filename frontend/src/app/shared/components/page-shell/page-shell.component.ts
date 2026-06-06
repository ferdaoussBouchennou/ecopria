import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd,
  Event,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.user.service';
import { defaultHomeForRole } from '../../../core/utils/auth-navigation.util';
import { resolveUploadUrl } from '../../../core/utils/upload-url.util';
import { Profile } from '../../../core/models/user.model';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss',
})
export class PageShellComponent implements OnInit, OnDestroy {
  profile?: Profile;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  showNotifs = false;
  showAccountMenu = false;
  notifTab: 'recent' | 'history' = 'recent';
  pageTitle = '';
  pageEyebrow = '';
  isCitizenRoute = false;

  private userId = 0;
  private citizenInitialized = false;
  private subs = new Subscription();

  constructor(
    public auth: AuthService,
    private router: Router,
    private profileSvc: UserProfileService,
    private notifSvc: NotificationService,
    private uiSvc: UiService
  ) {}

  ngOnInit(): void {
    this.updateRouteFlags(this.router.url);
    this.subs.add(
      this.router.events
        .pipe(filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e: NavigationEnd) => this.updateRouteFlags(e.urlAfterRedirects))
    );

    this.subs.add(this.uiSvc.currentTitle$.subscribe((t) => (this.pageTitle = t)));
    this.subs.add(this.uiSvc.currentEyebrow$.subscribe((e) => (this.pageEyebrow = e)));

    if (this.isCitizen) {
      this.initCitizenSession();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private updateRouteFlags(url: string): void {
    this.isCitizenRoute = url.startsWith('/espace');
    if (this.isCitizen && !this.profile) {
      this.initCitizenSession();
    }
  }

  private initCitizenSession(): void {
    if (this.citizenInitialized) {
      return;
    }
    try {
      this.userId = this.auth.requireUserId();
    } catch {
      return;
    }
    this.citizenInitialized = true;

    this.profileSvc.loadProfile();
    this.subs.add(
      this.profileSvc.profile$.subscribe((p) => {
        this.profile = p ?? undefined;
        if (p) {
          this.refreshNotifs();
          this.notifSvc.loadUnreadCount(this.userId);
        }
      })
    );
    this.subs.add(this.notifSvc.unreadCount$.subscribe((c) => (this.unreadCount = c)));
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get isCitizen(): boolean {
    return this.isLoggedIn && this.auth.getRole() === 'USER';
  }

  get showCitizenSubheader(): boolean {
    return this.isCitizenRoute && (!!this.pageTitle || !!this.pageEyebrow);
  }

  get monEspaceLink(): string[] {
    return [defaultHomeForRole(this.auth.getRole())];
  }

  get recompensesLink(): string[] {
    return ['/recompenses'];
  }

  get recompensesQueryParams(): Record<string, string> {
    return {};
  }

  get filteredNotifs(): AppNotification[] {
    if (this.notifTab === 'recent') {
      return this.notifications.filter((n) => !n.isRead);
    }
    return this.notifications.filter((n) => n.isRead);
  }

  get profileInitials(): string {
    if (!this.profile) return '?';
    return `${this.profile.firstName?.charAt(0) ?? ''}${this.profile.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  get profilePhoto(): string | undefined {
    return resolveUploadUrl(this.profile?.photo);
  }

  toggleNotifs(): void {
    this.showNotifs = !this.showNotifs;
    this.showAccountMenu = false;
  }

  toggleAccountMenu(): void {
    this.showAccountMenu = !this.showAccountMenu;
    this.showNotifs = false;
  }

  closeMenus(): void {
    this.showNotifs = false;
    this.showAccountMenu = false;
  }

  refreshNotifs(): void {
    if (!this.userId) return;
    this.notifSvc.getAll(this.userId).subscribe((n) => {
      this.notifications = n.filter((item) => item.userId === this.userId);
    });
  }

  markAsRead(id: number): void {
    this.notifSvc.markAsRead(id).subscribe(() => this.refreshNotifs());
  }

  markAllRead(): void {
    this.notifSvc.markAllAsRead(this.userId).subscribe(() => this.refreshNotifs());
  }

  logout(): void {
    this.auth.clearSession();
    this.closeMenus();
    void this.router.navigate(['/connexion']);
  }
}
