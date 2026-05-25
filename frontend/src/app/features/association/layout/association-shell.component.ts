import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

interface Notification {
  id: number;
  message: string;
  createdAt: Date;
  read: boolean;
}

@Component({
  selector: 'app-association-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './association-shell.component.html',
  styleUrls: ['./association-shell.component.css']
})
export class AssociationShellComponent implements OnInit {
  associationName: string = '';
  associationId: number = 0;
  showNotifications: boolean = false;
  notifications: Notification[] = [];
  unreadCount: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Récupérer les infos de l'association depuis le service d'authentification
    // Pour l'instant, données mockées
    this.loadAssociationInfo();
    this.loadNotifications();
  }

  loadAssociationInfo(): void {
    // TODO: Remplacer par un vrai appel API
    // this.authService.getCurrentAssociation().subscribe(...)
    
    // Mock data pour le développement
    this.associationName = 'Méditerranée Propre';
    this.associationId = 1;
  }

  loadNotifications(): void {
    // TODO: Remplacer par un vrai appel API
    // this.notificationService.getNotifications(this.associationId).subscribe(...)
    
    // Mock data pour le développement
    this.notifications = [
      {
        id: 1,
        message: 'Nouvelle inscription à votre action "Nettoyage de la plage"',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        read: false
      },
      {
        id: 2,
        message: 'Votre action "Plantation d\'arbres" a été publiée avec succès',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        read: false
      },
      {
        id: 3,
        message: '5 nouvelles inscriptions cette semaine',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true
      }
    ];

    this.updateUnreadCount();
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
    // TODO: Appel API pour marquer comme lu
    // this.notificationService.markAllAsRead(this.associationId).subscribe(...)
  }

  formatTime(date: Date): string {
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
      .map(word => word[0])
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
    // TODO: Implémenter la déconnexion
    if (confirm('Voulez-vous vous déconnecter ?')) {
      // this.authService.logout();
      this.router.navigate(['/actions']);
    }
  }
}
