import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import {
  AccountValidationFilter,
  AccountValidationItem,
  AdminLog,
} from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-comptes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-comptes.component.html',
  styleUrl: './admin-comptes.component.scss',
})
export class AdminComptesComponent implements OnInit {
  loading = true;
  actionLoading = false;
  error = '';
  actionMessage = '';
  rejectReason = '';

  filter: AccountValidationFilter = 'pending';
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  totalCount = 0;

  items: AccountValidationItem[] = [];
  selectedItem: AccountValidationItem | null = null;
  auditLogs: AdminLog[] = [];

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  setFilter(filter: AccountValidationFilter): void {
    if (this.filter === filter) {
      return;
    }
    this.filter = filter;
    this.selectedItem = null;
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.actionMessage = '';

    this.admin.getAccountValidations(this.filter).subscribe({
      next: (page) => {
        this.pendingCount = page.pendingCount ?? 0;
        this.approvedCount = page.approvedCount ?? 0;
        this.rejectedCount = page.rejectedCount ?? 0;
        this.totalCount = page.totalCount ?? 0;
        this.items = (page.items ?? []).map((item) => ({
          ...item,
          role: item.role === 'PARTNER' ? 'PARTNER' : 'ASSOCIATION',
        }));
        this.selectedItem = this.items[0] ?? null;
        this.loadAudit();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les comptes.';
      },
    });
  }

  select(item: AccountValidationItem): void {
    this.selectedItem = item;
    this.rejectReason = '';
    this.actionMessage = '';
  }

  isPending(item: AccountValidationItem | null): boolean {
    return item?.status === 'En attente';
  }

  approveSelected(): void {
    if (!this.selectedItem || !this.isPending(this.selectedItem)) {
      return;
    }
    this.actionLoading = true;
    const call =
      this.selectedItem.role === 'ASSOCIATION'
        ? this.admin.approveAssociation(this.selectedItem.userId)
        : this.admin.approvePartenaire(this.selectedItem.userId);

    call.subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte approuvé.';
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec de l’approbation.';
      },
    });
  }

  rejectSelected(): void {
    if (!this.selectedItem || !this.isPending(this.selectedItem)) {
      return;
    }
    this.actionLoading = true;
    const reason = this.rejectReason.trim() || 'Rejet administratif';
    const call =
      this.selectedItem.role === 'ASSOCIATION'
        ? this.admin.rejectAssociation(this.selectedItem.userId, reason)
        : this.admin.rejectPartenaire(this.selectedItem.userId, reason);

    call.subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte rejeté.';
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec du rejet.';
      },
    });
  }

  private loadAudit(): void {
    this.admin.getLogs().subscribe({
      next: (logs) => {
        this.auditLogs = logs.slice(0, 6);
      },
      error: () => {
        this.auditLogs = [];
      },
    });
  }
}