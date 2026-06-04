import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { AssociationUiService } from '../services/association-ui.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-association-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet],
  templateUrl: './association-shell.component.html',
  styleUrls: ['./association-shell.component.css']
})
export class AssociationShellComponent implements OnInit {
  associationName = '';
  associationLogo = '';
  associationId = 0;
  showNotifications = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  profileLoadError = '';
  notificationsError = '';

  constructor(
    private router: Router,
    private associationService: AssociationService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public ui: AssociationUiService
  ) {}

  ngOnInit(): void {
    this.loadAssociationInfo();
  }

  loadAssociationInfo(): void {
    const authId = this.associationService.getAssociationAuthId();
    this.associationService.getProfile(authId).subscribe({
      next: (profile) => {
        this.associationName = profile.name;
        this.associationLogo = profile.logo || '';
        this.associationId = profile.id;
        this.profileLoadError = '';
        this.loadNotifications(authId);

        // Si le profil est incomplet (pas de description), on redirige vers la page profil
        if ((!profile.description || profile.description.trim() === '') && !this.router.url.includes('/association/profil')) {
          this.router.navigate(['/association/profil']);
        }
      },
      error: (err) => {
        this.associationName = 'Association';
        this.profileLoadError = httpErrorMessage(
          err,
          'Profil association introuvable. Démarrez service-utilisateur et exécutez scripts/seed-dev-data.sql.'
        );
      }
    });
  }

  loadNotifications(authId: number): void {
    this.notificationsError = '';
    this.notificationService.getAll(authId).subscribe({
      next: (list) => {
        this.notifications = list;
        this.unreadCount = list.filter((n) => !n.isRead).length;
      },
      error: (err) => {
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationsError = httpErrorMessage(
          err,
          'Notifications indisponibles (service-notification :8086).'
        );
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      const authId = this.associationService.getAssociationAuthId();
      this.loadNotifications(authId);
    }
  }

  markAllAsRead(): void {
    const authId = this.associationService.getAssociationAuthId();
    this.notificationService.markAllAsRead(authId).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
        this.unreadCount = 0;
      },
      error: (err) => console.error('Marquage notifications:', err)
    });
  }

  formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getInitials(): string {
    return this.associationName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.ui.confirm({
      title: 'Déconnexion',
      message: 'Voulez-vous vous déconnecter ?',
      confirmLabel: 'Se déconnecter',
      cancelLabel: 'Annuler'
    }).subscribe((ok) => {
      if (ok) {
        this.authService.logout();
        void this.router.navigate(['/']);
      }
    });
  }

  onPromptInput(value: string): void {
    this.ui.setPromptValue(value);
  }
}
