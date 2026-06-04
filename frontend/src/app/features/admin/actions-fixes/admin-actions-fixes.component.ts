import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import {
  ActionAssociationRequest,
  ActionFixe,
  ActionFixeRequest,
  ActionNonFixe,
} from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-actions-fixes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-actions-fixes.component.html',
  styleUrl: './admin-actions-fixes.component.scss',
})
export class AdminActionsFixesComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  message = '';
  search = '';
  actionType: 'fixed' | 'non-fixed' = 'fixed';

  items: ActionFixe[] = [];
  nonFixedItems: ActionNonFixe[] = [];
  editingId: number | null = null;
  editingNonFixedId: number | null = null;

  form: ActionFixeRequest = this.emptyForm();
  nonFixedForm: ActionAssociationRequest = this.emptyNonFixedForm();

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  get filteredItems(): ActionFixe[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter(
      (a) =>
        a.titre.toLowerCase().includes(q) ||
        a.categorie.toLowerCase().includes(q)
    );
  }

  get filteredNonFixedItems(): ActionNonFixe[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.nonFixedItems;
    }
    return this.nonFixedItems.filter(
      (a) =>
        (a.title ?? '').toLowerCase().includes(q) ||
        (a.categoryName ?? '').toLowerCase().includes(q)
    );
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    if (this.actionType === 'fixed') {
      this.admin.getActionsFixes().subscribe({
        next: (list) => {
          this.items = list ?? [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'Impossible de charger les actions fixes.';
        },
      });
      return;
    }

    this.admin.getActionsNonFixes().subscribe({
      next: (list) => {
        this.nonFixedItems = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les actions non fixes.';
      },
    });
  }

  startCreate(): void {
    this.editingId = null;
    this.editingNonFixedId = null;
    this.form = this.emptyForm();
    this.nonFixedForm = this.emptyNonFixedForm();
    this.message = '';
  }

  setActionType(type: 'fixed' | 'non-fixed'): void {
    if (this.actionType === type) {
      return;
    }
    this.actionType = type;
    this.startCreate();
    this.reload();
  }

  startEdit(item: ActionFixe): void {
    this.editingId = item.id;
    this.message = '';
    this.form = {
      titre: item.titre,
      description: item.description ?? '',
      categorie: item.categorie,
      points: item.points,
    };
  }

  startEditNonFixed(item: ActionNonFixe): void {
    this.editingId = null;
    this.editingNonFixedId = item.id;
    this.message = '';
    this.nonFixedForm = {
      titre: item.title ?? '',
      categorie: item.categoryName ?? '',
      points: item.points ?? 10,
      associationId: 1,
      associationName: '',
      latitude: 33.5731,
      longitude: -7.5898,
      lieu: item.city ?? '',
      placesTotal: 20,
      description: '',
    };
  }

  submit(): void {
    if (this.actionType === 'non-fixed') {
      this.submitNonFixed();
      return;
    }
    const titre = this.form.titre.trim();
    const categorie = this.form.categorie.trim();
    if (!titre || !categorie) {
      this.message = 'Titre et catégorie sont obligatoires.';
      return;
    }
    if (this.form.points == null || this.form.points < 0) {
      this.message = 'Les points doivent être un nombre positif.';
      return;
    }

    const body: ActionFixeRequest = {
      titre,
      categorie,
      points: Number(this.form.points),
      description: this.form.description?.trim() || undefined,
    };

    this.saving = true;
    this.message = '';
    const call =
      this.editingId != null
        ? this.admin.updateActionFixe(this.editingId, body)
        : this.admin.createActionFixe(body);

    call.subscribe({
      next: () => {
        this.saving = false;
        this.message = this.editingId != null ? 'Action mise à jour.' : 'Action créée.';
        this.editingId = null;
        this.form = this.emptyForm();
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.message = this.readErrorMessage(err, 'Échec de l’enregistrement.');
      },
    });
  }

  submitNonFixed(): void {
    const titre = this.nonFixedForm.titre.trim();
    const categorie = this.nonFixedForm.categorie.trim();
    if (!titre || !categorie) {
      this.message = 'Titre et catégorie sont obligatoires.';
      return;
    }
    if (!this.nonFixedForm.associationId || this.nonFixedForm.associationId <= 0) {
      this.message = 'Association ID est obligatoire.';
      return;
    }

    const body: ActionAssociationRequest = {
      titre,
      categorie,
      points: Number(this.nonFixedForm.points ?? 10),
      associationId: Number(this.nonFixedForm.associationId),
      description: this.nonFixedForm.description?.trim() || undefined,
      associationName: this.nonFixedForm.associationName?.trim() || undefined,
      lieu: this.nonFixedForm.lieu?.trim() || undefined,
      latitude: Number(this.nonFixedForm.latitude ?? 33.5731),
      longitude: Number(this.nonFixedForm.longitude ?? -7.5898),
      placesTotal: this.nonFixedForm.placesTotal
        ? Number(this.nonFixedForm.placesTotal)
        : undefined,
    };

    this.saving = true;
    this.message = '';
    const call =
      this.editingNonFixedId != null
        ? this.admin.updateActionNonFixe(this.editingNonFixedId, body)
        : this.admin.createActionNonFixe(body);
    call.subscribe({
      next: () => {
        this.saving = false;
        this.message =
          this.editingNonFixedId != null ? 'Action non fixe mise à jour.' : 'Action non fixe créée.';
        this.editingNonFixedId = null;
        this.nonFixedForm = this.emptyNonFixedForm();
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.message = this.readErrorMessage(err, 'Échec de l’enregistrement.');
      },
    });
  }

  deactivate(item: ActionFixe, event: Event): void {
    event.stopPropagation();
    if (!item.active) {
      return;
    }
    if (!confirm(`Désactiver « ${item.titre} » ?`)) {
      return;
    }
    this.admin.deactivateActionFixe(item.id).subscribe({
      next: () => {
        this.message = 'Action désactivée.';
        this.reload();
      },
      error: () => {
        this.message = 'Échec de la désactivation.';
      },
    });
  }

  deactivateNonFixed(item: ActionNonFixe, event: Event): void {
    event.stopPropagation();
    if (item.status === 'CANCELLED') {
      return;
    }
    if (!confirm(`Désactiver « ${item.title} » ?`)) {
      return;
    }
    this.admin.deactivateActionNonFixe(item.id).subscribe({
      next: () => {
        this.message = 'Action non fixe désactivée.';
        this.reload();
      },
      error: () => {
        this.message = 'Échec de la désactivation.';
      },
    });
  }

  statusLabel(item: ActionFixe): string {
    return item.active ? 'Active' : 'Brouillon';
  }

  statusClass(item: ActionFixe): string {
    return item.active ? 'status-pill--active' : 'status-pill--draft';
  }

  private emptyForm(): ActionFixeRequest {
    return {
      titre: '',
      categorie: '',
      description: '',
      points: 10,
    };
  }

  private emptyNonFixedForm(): ActionAssociationRequest {
    return {
      titre: '',
      categorie: '',
      description: '',
      associationId: 1,
      associationName: '',
      latitude: 33.5731,
      longitude: -7.5898,
      points: 10,
      placesTotal: 20,
      lieu: '',
    };
  }

  private readErrorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }
    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: string }).message;
      if (message?.trim()) {
        return message;
      }
    }
    if (err.status === 0) {
      return 'Service indisponible. Vérifiez que admin-service et service-action (9090) sont démarrés.';
    }
    return fallback;
  }
}
