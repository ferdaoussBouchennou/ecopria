import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminUser,
  AdminUserActionResult,
  AdminUserRole,
  AdminUserStatusFilter,
  AdminUsersQuery,
} from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  loading = true;
  acting = false;
  error = '';
  message = '';
  searchEmail = '';
  statusFilter: AdminUserStatusFilter = 'all';
  roleFilter: AdminUserRole | 'all' = 'all';
  allItems: AdminUser[] = [];
  selected: AdminUser | null = null;
  banRaison = '';
  showBanForm = false;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  get items(): AdminUser[] {
    return this.allItems.filter((u) => this.matchesStatusFilter(u));
  }

  get countActive(): number {
    return this.allItems.filter((u) => u.isActive).length;
  }

  get countBanned(): number {
    return this.allItems.filter((u) => u.isActive === false).length;
  }

  get countUnverified(): number {
    return this.allItems.filter((u) => !u.isVerified).length;
  }

  reload(preserveSelection = true): void {
    this.loading = true;
    this.error = '';
    const selectedId = preserveSelection ? this.selected?.userId : undefined;
    const query = this.buildQuery();

    this.admin.getUsers(query).subscribe({
      next: (list) => {
        this.allItems = list ?? [];
        this.loading = false;
        if (selectedId != null) {
          this.selected = this.allItems.find((u) => u.userId === selectedId) ?? null;
        }
      },
      error: () => {
        this.loading = false;
        this.error =
          'Impossible de charger les utilisateurs. Vérifiez admin-service (8087) et auth-service (8081).';
      },
    });
  }

  applyFilters(): void {
    this.selected = null;
    this.showBanForm = false;
    this.reload();
  }

  setStatusFilter(filter: AdminUserStatusFilter): void {
    this.statusFilter = filter;
    this.selected = null;
    this.showBanForm = false;
  }

  setRoleFilter(role: AdminUserRole | 'all'): void {
    this.roleFilter = role;
    this.applyFilters();
  }

  select(user: AdminUser): void {
    this.selected = user;
    this.showBanForm = false;
    this.banRaison = '';
    this.message = '';
  }

  ban(user: AdminUser): void {
    if (!this.showBanForm) {
      this.showBanForm = true;
      return;
    }
    const raison = this.banRaison.trim();
    if (!raison) {
      this.error = 'Indiquez une raison de bannissement.';
      return;
    }
    if (!confirm(`Bannir le compte ${user.email} ? L'utilisateur ne pourra plus se connecter.`)) {
      return;
    }
    this.runAction(
      () => this.admin.banUser(user.userId, raison),
      user.userId,
      { isActive: false },
      () => {
        this.showBanForm = false;
        this.banRaison = '';
      }
    );
  }

  reactivate(user: AdminUser): void {
    if (!confirm(`Réactiver le compte ${user.email} ?`)) {
      return;
    }
    this.runAction(
      () => this.admin.reactivateUser(user.userId),
      user.userId,
      { isActive: true }
    );
  }

  canBan(user: AdminUser): boolean {
    return user.isActive === true && user.role !== 'ADMIN';
  }

  canReactivate(user: AdminUser): boolean {
    return user.isActive === false;
  }

  roleLabel(role?: string): string {
    switch (role) {
      case 'USER':
        return 'Citoyen';
      case 'ASSOCIATION':
        return 'Association';
      case 'PARTNER':
        return 'Partenaire';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return role ?? '—';
    }
  }

  statusLabel(user: AdminUser): string {
    if (user.isActive === false) {
      return 'Banni';
    }
    if (!user.isVerified) {
      return 'Non vérifié';
    }
    return 'Actif';
  }

  statusClass(user: AdminUser): string {
    if (user.isActive === false) {
      return 'status-pill--warn';
    }
    if (!user.isVerified) {
      return 'status-pill--draft';
    }
    return 'status-pill--ok';
  }

  displayName(user: AdminUser): string {
    return user.displayName?.trim() || user.email;
  }

  private matchesStatusFilter(user: AdminUser): boolean {
    switch (this.statusFilter) {
      case 'active':
        return user.isActive === true;
      case 'banned':
        return user.isActive === false;
      case 'unverified':
        return !user.isVerified;
      default:
        return true;
    }
  }

  private buildQuery(): AdminUsersQuery {
    const query: AdminUsersQuery = {};
    if (this.searchEmail.trim()) {
      query.email = this.searchEmail.trim();
    }
    if (this.roleFilter !== 'all') {
      query.role = this.roleFilter;
    }
    return query;
  }

  private patchUserLocally(userId: number, patch: Partial<AdminUser>): void {
    this.allItems = this.allItems.map((u) =>
      u.userId === userId ? { ...u, ...patch } : u
    );
    if (this.selected?.userId === userId) {
      this.selected = { ...this.selected, ...patch };
    }
  }

  private runAction(
    call: () => ReturnType<AdminService['banUser']>,
    userId: number,
    patch: Partial<AdminUser>,
    onSuccess?: () => void
  ): void {
    this.acting = true;
    this.error = '';
    this.message = '';
    call().subscribe({
      next: (result: AdminUserActionResult) => {
        this.acting = false;
        this.patchUserLocally(userId, patch);
        onSuccess?.();
        this.message = result?.message ?? 'Opération réussie.';
        if (result && !result.emailSent) {
          this.error =
            'Le statut a été mis à jour, mais l\'e-mail n\'a pas été envoyé. ' +
            'Démarrez service-notification (port 8086) et vérifiez le fichier .env.';
        }
        this.reload(true);
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
