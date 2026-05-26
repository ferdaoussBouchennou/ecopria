import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';
import { httpErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-association-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './association-shell.component.html',
  styleUrls: ['./association-shell.component.css']
})
export class AssociationShellComponent implements OnInit {
  associationName = '';
  associationId = 0;
  showNotifications = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  profileLoadError = '';
  notificationsError = '';

  constructor(
    private router: Router,
    private associationService: AssociationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAssociationInfo();
  }

  loadAssociationInfo(): void {
    const authId = this.associationService.getAssociationAuthId();
    this.associationService.getProfile(authId).subscribe({
      next: (profile) => {
        this.associationName = profile.name;
        this.associationId = profile.id;
        this.profileLoadError = '';
        this.loadNotifications(authId);
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
    if (confirm('Voulez-vous vous déconnecter ?')) {
      this.router.navigate(['/actions']);
    }
  }
}
