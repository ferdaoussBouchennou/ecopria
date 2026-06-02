import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboard } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  error = '';
  dashboard: AdminDashboard | null = null;
  commissionRate = 15;
  savingCommission = false;
  commissionMessage = '';

  activityBars: number[] = [];

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';
    this.admin.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.commissionRate = data.commissionRate ?? 15;
        this.activityBars = this.normalizeActivity(data.activityLast30Days ?? []);
        this.loading = false;
      },
      error: () => {
        this.error =
          'Impossible de charger le tableau de bord. Vérifiez que admin-service et les microservices sont démarrés.';
        this.loading = false;
      },
    });
  }

  saveCommissionRate(): void {
    if (!this.dashboard) {
      return;
    }
    this.savingCommission = true;
    this.commissionMessage = '';
    this.admin
      .updateConfiguration('taux_commission', String(this.commissionRate), 'Taux de commission global (%)')
      .subscribe({
        next: () => {
          this.savingCommission = false;
          this.commissionMessage = 'Taux enregistré.';
          if (this.dashboard) {
            this.dashboard.commissionRate = this.commissionRate;
          }
        },
        error: () => {
          this.savingCommission = false;
          this.commissionMessage = 'Échec de l’enregistrement.';
        },
      });
  }

  formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
    }
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  pendingDate(iso?: string): string {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  }

  private normalizeActivity(values: number[]): number[] {
    if (values.length === 0) {
      return Array.from({ length: 30 }, () => 0);
    }
    const max = Math.max(...values, 1);
    return values.map((value) => Math.round((value / max) * 100));
  }
}
