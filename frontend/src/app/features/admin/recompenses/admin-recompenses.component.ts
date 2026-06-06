import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminAvisFilter,
  AdminOffreFilter,
  AdminRecompenseAvis,
  AdminRecompenseCommission,
  AdminRecompenseCommissionSummary,
  AdminRecompenseOffre,
  AdminRecompenseTab,
} from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-recompenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-recompenses.component.html',
  styleUrl: './admin-recompenses.component.scss',
})
export class AdminRecompensesComponent implements OnInit, OnDestroy {
  loading = true;
  acting = false;
  error = '';
  message = '';
  activeTab: AdminRecompenseTab = 'offres';
  search = '';

  offres: AdminRecompenseOffre[] = [];
  commissions: AdminRecompenseCommission[] = [];
  commissionSummary: AdminRecompenseCommissionSummary | null = null;
  avis: AdminRecompenseAvis[] = [];

  offreFilter: AdminOffreFilter = 'all';
  avisFilter: AdminAvisFilter = 'all';

  selectedOffre: AdminRecompenseOffre | null = null;
  selectedAvis: AdminRecompenseAvis | null = null;
  detailVisible = false;

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

  switchTab(tab: AdminRecompenseTab): void {
    this.activeTab = tab;
    this.search = '';
    this.offreFilter = 'all';
    this.avisFilter = 'all';
    this.closeDetail();
    this.message = '';
    this.error = '';
  }

  reload(): void {
    this.loading = true;
    this.error = '';

    if (this.activeTab === 'offres') {
      this.admin.getRecompenseOffres().subscribe({
        next: (list) => {
          this.offres = list ?? [];
          this.loading = false;
        },
        error: () => this.failLoad(),
      });
      return;
    }

    if (this.activeTab === 'commissions') {
      this.admin.getRecompenseCommissionSummary().subscribe({
        next: (summary) => {
          this.commissionSummary = summary;
        },
      });
      this.admin.getRecompenseCommissions().subscribe({
        next: (list) => {
          this.commissions = list ?? [];
          this.loading = false;
        },
        error: () => this.failLoad(),
      });
      return;
    }

    this.admin.getRecompenseAvis().subscribe({
      next: (list) => {
        this.avis = list ?? [];
        this.loading = false;
      },
      error: () => this.failLoad(),
    });
  }

  get filteredOffres(): AdminRecompenseOffre[] {
    const q = this.search.trim().toLowerCase();
    return this.offres.filter((item) => {
      if (this.offreFilter === 'active' && !item.isActive) return false;
      if (this.offreFilter === 'inactive' && item.isActive) return false;
      if (!q) return true;
      return (
        (item.title ?? '').toLowerCase().includes(q) ||
        (item.partenaireName ?? '').toLowerCase().includes(q) ||
        (item.partenaireCategory ?? '').toLowerCase().includes(q) ||
        (item.type ?? '').toLowerCase().includes(q)
      );
    });
  }

  get filteredCommissions(): AdminRecompenseCommission[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.commissions;
    return this.commissions.filter(
      (item) =>
        (item.partenaireName ?? '').toLowerCase().includes(q) ||
        (item.offreTitle ?? '').toLowerCase().includes(q) ||
        (item.couponCode ?? '').toLowerCase().includes(q) ||
        (item.moisFacturation ?? '').includes(q)
    );
  }

  get filteredAvis(): AdminRecompenseAvis[] {
    const q = this.search.trim().toLowerCase();
    return this.avis.filter((item) => {
      if (this.avisFilter === 'visible' && item.visible === false) return false;
      if (this.avisFilter === 'hidden' && item.visible !== false) return false;
      if (!q) return true;
      return (
        (item.authorName ?? '').toLowerCase().includes(q) ||
        (item.partenaireName ?? '').toLowerCase().includes(q) ||
        (item.comment ?? '').toLowerCase().includes(q)
      );
    });
  }

  get countOffresActive(): number {
    return this.offres.filter((o) => o.isActive).length;
  }

  get countOffresInactive(): number {
    return this.offres.filter((o) => !o.isActive).length;
  }

  get countAvisVisible(): number {
    return this.avis.filter((a) => a.visible !== false).length;
  }

  get countAvisHidden(): number {
    return this.avis.filter((a) => a.visible === false).length;
  }

  viewOffre(item: AdminRecompenseOffre): void {
    this.selectedOffre = item;
    this.selectedAvis = null;
    this.detailVisible = true;
    document.body.style.overflow = 'hidden';
  }

  viewAvis(item: AdminRecompenseAvis): void {
    this.selectedAvis = item;
    this.selectedOffre = null;
    this.detailVisible = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.detailVisible = false;
    this.selectedOffre = null;
    this.selectedAvis = null;
    document.body.style.overflow = '';
  }

  activateOffre(item: AdminRecompenseOffre): void {
    if (!confirm(`Réactiver l'offre « ${item.title} » ?`)) return;
    this.runAction(
      () => this.admin.activateRecompenseOffre(item.id),
      'Offre réactivée.'
    );
  }

  suspendOffre(item: AdminRecompenseOffre): void {
    if (!confirm(`Suspendre l'offre « ${item.title} » ? Elle disparaîtra du catalogue public.`)) {
      return;
    }
    this.runAction(
      () => this.admin.suspendRecompenseOffre(item.id),
      'Offre suspendue.'
    );
  }

  hideAvis(item: AdminRecompenseAvis): void {
    if (!confirm(`Masquer l'avis de ${item.authorName ?? 'ce client'} ?`)) return;
    this.runAction(() => this.admin.hideRecompenseAvis(item.id), 'Avis masqué.');
  }

  showAvis(item: AdminRecompenseAvis): void {
    this.runAction(() => this.admin.showRecompenseAvis(item.id), 'Avis réaffiché.');
  }

  deleteAvis(item: AdminRecompenseAvis): void {
    if (!confirm('Supprimer définitivement cet avis ?')) return;
    this.runAction(() => this.admin.deleteRecompenseAvis(item.id), 'Avis supprimé.');
  }

  typeLabel(type?: string): string {
    switch (type) {
      case 'STOCK':
        return 'Stock';
      case 'REDUCTION':
        return 'Réduction';
      case 'SERVICE':
        return 'Service';
      case 'EXPERIENCE':
        return 'Expérience';
      default:
        return type ?? '—';
    }
  }

  formatMois(mois: string): string {
    const [y, m] = mois.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    return `${months[Number(m) - 1] ?? m} ${y}`;
  }

  stars(rating?: number): string {
    const n = Math.max(0, Math.min(5, rating ?? 0));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  private failLoad(): void {
    this.loading = false;
    this.error =
      'Impossible de charger les données. Vérifiez admin-service, service-recompense et la gateway.';
  }

  private runAction(
    call: () => ReturnType<AdminService['activateRecompenseOffre']>,
    successMsg: string
  ): void {
    this.acting = true;
    this.error = '';
    call().subscribe({
      next: () => {
        this.acting = false;
        this.message = successMsg;
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
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    return fallback;
  }
}
