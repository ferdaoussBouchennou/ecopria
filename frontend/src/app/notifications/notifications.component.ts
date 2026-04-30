import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../core/services/notification.service';
import { AppNotification } from '../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="page-shell single-page">
      <main class="content-grid">
        <section class="hero card-soft">
          <p class="eyebrow">Notifications</p>
          <h1>Centre de messages</h1>
          <p class="muted">Service-notification fournit ici les notifications in-app.</p>
        </section>

        <section class="page-head card-soft">
          <button class="btn-primary" (click)="readAll()">Tout marquer comme lu</button>
        </section>

        <section class="notifs-list">
          <article class="card-soft notif" *ngFor="let n of notifications" [class.unread]="!n.isRead" [class.success]="n.type === 'SUCCESS'" [class.alert]="n.type === 'ALERT'" (click)="read(n)">
            <span class="notif-icon">{{ icon(n.type) }}</span>
            <div class="notif-body">
              <p class="notif-title">{{ n.title }}</p>
              <p class="notif-msg">{{ n.message }}</p>
              <p class="notif-date">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <span class="dot" *ngIf="!n.isRead"></span>
          </article>
        </section>
      </main>
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  readonly userId = 1;
  notifications: AppNotification[] = [];

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getAll(this.userId).subscribe((items) => {
      this.notifications = items;
    });
  }

  read(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.isRead = true;
      });
    }
  }

  readAll(): void {
    this.notificationService.markAllAsRead(this.userId).subscribe(() => {
      this.notifications.forEach((notification) => (notification.isRead = true));
    });
  }

  icon(type: string): string {
    return type === 'SUCCESS' ? '✅' : type === 'ALERT' ? '🚨' : 'ℹ️';
  }
}