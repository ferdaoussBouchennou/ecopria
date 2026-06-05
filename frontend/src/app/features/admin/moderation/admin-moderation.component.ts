import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import {
  ModerationAction,
  ModerationActionStatus,
  ModerationFilter,
} from '../../../core/models/admin.model';
import { getCategoryImageUrl } from '../../action/utils/category-image.util';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-moderation.component.html',
  styleUrl: './admin-moderation.component.scss',
})
export class AdminModerationComponent implements OnInit, OnDestroy {
  loading = true;
  acting = false;
  error = '';
  message = '';
  search = '';
  filter: ModerationFilter = 'all';
  items: ModerationAction[] = [];
  selected: ModerationAction | null = null;
  detailVisible = false;
  suspendRaison = '';
  showSuspendForm = false;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.detailVisible && !this.acting) {
      this.closeDetail();
    }
  }

  get filteredItems(): ModerationAction[] {
    const q = this.search.trim().toLowerCase();
    return this.items.filter((item) => {
      if (!this.matchesFilter(item)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        (item.title ?? '').toLowerCase().includes(q) ||
        (item.associationName ?? '').toLowerCase().includes(q) ||
        (item.city ?? '').toLowerCase().includes(q) ||
        (item.categoryName ?? '').toLowerCase().includes(q)
      );
    });
  }

  get countDraft(): number {
    return this.items.filter((i) => i.status === 'DRAFT').length;
  }

  get countPublished(): number {
    return this.items.filter((i) => i.status === 'PUBLISHED').length;
  }

  get countSuspended(): number {
    return this.items.filter((i) => i.status === 'CANCELLED').length;
  }

  get countCompleted(): number {
    return this.items.filter((i) => i.status === 'COMPLETED').length;
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.admin.getModerationActions().subscribe({
      next: (list) => {
        this.items = list ?? [];
        this.loading = false;
        if (this.selected) {
          this.selected =
            this.items.find((i) => i.id === this.selected!.id) ?? null;
        }
      },
      error: () => {
        this.loading = false;
        this.error =
          'Impossible de charger les actions. Vérifiez admin-service, service-action et la gateway.';
      },
    });
  }

  setFilter(filter: ModerationFilter): void {
    this.filter = filter;
    this.closeDetail();
  }

  viewItem(item: ModerationAction, openSuspendForm = false): void {
    this.selected = item;
    this.showSuspendForm = openSuspendForm;
    this.suspendRaison = '';
    this.message = '';
    this.detailVisible = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.detailVisible = false;
    this.selected = null;
    this.showSuspendForm = false;
    this.suspendRaison = '';
    document.body.style.overflow = '';
  }

  publish(item: ModerationAction): void {
    if (!confirm(`Publier l'action « ${item.title} » ? Elle sera visible sur la plateforme.`)) {
      return;
    }
    this.runAction(() => this.admin.publishModerationAction(item.id), 'Action publiée.');
  }

  suspend(item: ModerationAction): void {
    if (!this.showSuspendForm) {
      this.showSuspendForm = true;
      return;
    }
    const raison = this.suspendRaison.trim();
    if (!raison) {
      this.error = 'Indiquez une raison de suspension.';
      return;
    }
    this.runAction(
      () => this.admin.suspendModerationAction(item.id, raison),
      'Action suspendue.',
      () => {
        this.showSuspendForm = false;
        this.suspendRaison = '';
      }
    );
  }

  canPublish(item: ModerationAction): boolean {
    return item.status === 'DRAFT' || item.status === 'CANCELLED';
  }

  canSuspend(item: ModerationAction): boolean {
    return item.status === 'PUBLISHED' || item.status === 'DRAFT';
  }

  statusLabel(status?: ModerationActionStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'PUBLISHED':
        return 'Publiée';
      case 'CANCELLED':
        return 'Suspendue';
      case 'COMPLETED':
        return 'Terminée';
      default:
        return '—';
    }
  }

  statusClass(status?: ModerationActionStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'status-pill--draft';
      case 'PUBLISHED':
        return 'status-pill--ok';
      case 'CANCELLED':
        return 'status-pill--warn';
      case 'COMPLETED':
        return 'status-pill--muted';
      default:
        return '';
    }
  }

  imageSrc(item: ModerationAction): string | null {
    const photos = item.photoUrls?.filter(Boolean);
    if (photos?.length) {
      const url = photos[0];
      return url.startsWith('http') || url.startsWith('/') ? url : '/' + url;
    }
    if (item.categoryName) {
      const url = getCategoryImageUrl(item.categoryName, item.categoryImageUrl);
      return url.startsWith('http') || url.startsWith('/') ? url : '/' + url;
    }
    return null;
  }

  private matchesFilter(item: ModerationAction): boolean {
    switch (this.filter) {
      case 'draft':
        return item.status === 'DRAFT';
      case 'published':
        return item.status === 'PUBLISHED';
      case 'suspended':
        return item.status === 'CANCELLED';
      case 'completed':
        return item.status === 'COMPLETED';
      default:
        return true;
    }
  }

  private runAction(
    call: () => ReturnType<AdminService['publishModerationAction']>,
    successMsg: string,
    onSuccess?: () => void
  ): void {
    this.acting = true;
    this.error = '';
    call().subscribe({
      next: () => {
        this.acting = false;
        this.message = successMsg;
        onSuccess?.();
        this.closeDetail();
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.acting = false;
        this.error = this.extractError(err, 'Opération impossible.');
      },
    });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.message) {
      return body.message;
    }
    return fallback;
  }
}
