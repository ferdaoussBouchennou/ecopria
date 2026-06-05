import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminCategorie,
  AdminCategorieRequest,
  ActionDbCategory,
  CategoryCardView,
  CategoryDeletePreview,
} from '../../../core/models/admin.model';
@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit, OnDestroy {
  loading = true;
  saving = false;
  error = '';
  message = '';
  items: AdminCategorie[] = [];
  actionDbCategories: ActionDbCategory[] = [];
  actionDbLoading = false;
  actionDbError = '';
  editingId: number | null = null;
  editingActionDbOnly: string | null = null;
  formVisible = false;

  deleteModalOpen = false;
  deletePreview: CategoryDeletePreview | null = null;
  deletePreviewLoading = false;
  deleteConfirmLoading = false;
  deleteModalError = '';

  form: AdminCategorieRequest = this.emptyForm();
  imagePreview: string | null = null;
  imageFileName = '';
  uploadingImage = false;
  imageUploadError = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.formVisible && !this.saving) {
      this.closeForm();
    }
  }

  openCreate(): void {
    this.startCreate();
    this.formVisible = true;
    document.body.style.overflow = 'hidden';
  }

  closeForm(): void {
    this.formVisible = false;
    this.startCreate();
    document.body.style.overflow = '';
  }

  loadAll(): void {
    this.loading = true;
    this.actionDbLoading = true;
    this.error = '';
    this.actionDbError = '';

    this.admin.getCategories().subscribe({
      next: (list) => {
        this.items = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error =
          'Impossible de charger les catégories. Vérifiez que admin-service (8087) et la gateway (8080) sont démarrés.';
      },
    });

    this.admin.getActionDbCategories().subscribe({
      next: (list) => {
        this.actionDbCategories = list ?? [];
        this.actionDbLoading = false;
      },
      error: () => {
        this.actionDbLoading = false;
        this.actionDbError =
          'Impossible de charger certaines catégories depuis le service action (9090).';
      },
    });
  }

  reload(): void {
    this.loadAll();
  }

  startCreate(): void {
    this.editingId = null;
    this.editingActionDbOnly = null;
    this.resetForm();
    this.message = '';
  }

  openCategory(card: CategoryCardView): void {
    if (card.adminItem) {
      this.startEdit(card.adminItem);
    } else {
      this.startEditFromActionDb({
        id: card.actionDbId ?? 0,
        name: card.name,
        description: card.description,
        imageUrl: card.imageUrl,
        published: card.published,
        actionCount: card.actionCount,
      });
    }
    this.formVisible = true;
    document.body.style.overflow = 'hidden';
  }

  startEditFromActionDb(cat: ActionDbCategory): void {
    const adminItem = this.findAdminItem(cat.name);
    if (adminItem) {
      this.editingActionDbOnly = null;
      this.startEdit(adminItem);
      return;
    }

    this.editingId = null;
    this.editingActionDbOnly = cat.name;
    this.message = '';
    this.imageUploadError = '';
    this.form = {
      nom: cat.name,
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      published: cat.published !== false,
    };
    this.imageFileName = '';
    this.imagePreview = cat.imageUrl?.trim() ? this.resolveImageUrl(cat.imageUrl) : null;
  }

  startEdit(item: AdminCategorie): void {
    this.editingId = item.id;
    this.editingActionDbOnly = null;
    this.message = '';
    this.imageUploadError = '';
    this.form = {
      nom: item.nom,
      description: item.description ?? '',
      imageUrl: item.imageUrl ?? '',
      published: item.published !== false,
    };
    this.imageFileName = '';
    this.imagePreview = item.imageUrl?.trim() ? this.resolveImageUrl(item.imageUrl) : null;
  }

  submit(): void {
    if (!this.form.nom?.trim()) {
      this.error = 'Le nom de la catégorie est obligatoire.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.message = '';
    const body: AdminCategorieRequest = {
      nom: this.form.nom.trim(),
      description: this.form.description?.trim() || undefined,
      imageUrl: this.form.imageUrl?.trim() || undefined,
      published: this.form.published !== false,
    };

    const call =
      this.editingId != null
        ? this.admin.updateCategory(this.editingId, body)
        : this.admin.createCategory(body);

    call.subscribe({
      next: () => {
        this.saving = false;
        this.message =
          this.editingId != null
            ? `Catégorie « ${body.nom} » mise à jour.`
            : this.editingActionDbOnly
              ? `Catégorie « ${body.nom} » enregistrée et synchronisée.`
              : `Catégorie « ${body.nom} » créée.`;
        this.closeForm();
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = this.extractError(err, 'Enregistrement impossible.');
      },
    });
  }

  togglePublish(item: AdminCategorie, event: Event): void {
    event.stopPropagation();
    const publish = !item.published;
    const req = publish
      ? this.admin.publishCategory(item.id)
      : this.admin.unpublishCategory(item.id);
    req.subscribe({
      next: () => {
        this.message = publish
          ? `« ${item.nom} » est publiée.`
          : `« ${item.nom} » est dépubliée.`;
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.extractError(err, 'Modification du statut impossible.');
      },
    });
  }

  deleteItem(item: AdminCategorie, event: Event): void {
    event.stopPropagation();
    this.deleteModalOpen = true;
    this.deletePreview = null;
    this.deleteModalError = '';
    this.deletePreviewLoading = true;

    this.admin.getCategoryDeletePreview(item.id).subscribe({
      next: (preview) => {
        this.deletePreview = preview;
        this.deletePreviewLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.deletePreviewLoading = false;
        this.deleteModalError = this.extractError(
          err,
          'Impossible de préparer la suppression.'
        );
      },
    });
  }

  closeDeleteModal(): void {
    if (this.deleteConfirmLoading) {
      return;
    }
    this.deleteModalOpen = false;
    this.deletePreview = null;
    this.deleteModalError = '';
  }
  confirmDelete(): void {
    if (!this.deletePreview) {
      return;
    }
    const preview = this.deletePreview;
    const cascade = preview.actionCount > 0;
    this.deleteConfirmLoading = true;
    this.deleteModalError = '';

    this.admin.deleteCategory(preview.id, cascade).subscribe({
      next: () => {
        this.deleteConfirmLoading = false;
        this.deleteModalOpen = false;
        this.deletePreview = null;
        this.message = cascade
          ? `Catégorie « ${preview.nom} » et ${preview.actionCount} action(s) supprimée(s).`
          : `Catégorie « ${preview.nom} » supprimée.`;
        if (this.editingId === preview.id) {
          this.closeForm();
        }
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.deleteConfirmLoading = false;
        this.deleteModalError = this.extractError(err, 'Suppression impossible.');
      },
    });
  }

  actionStatusLabel(status?: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'Publiée';
      case 'DRAFT':
        return 'Brouillon';
      case 'CANCELLED':
        return 'Annulée';
      case 'COMPLETED':
        return 'Terminée';
      default:
        return status ?? '—';
    }
  }

  get displayCategories(): CategoryCardView[] {
    const map = new Map<string, CategoryCardView>();

    for (const cat of this.actionDbCategories) {
      const key = cat.name.trim().toLowerCase();
      map.set(key, {
        key: `action-${cat.id}`,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        published: cat.published,
        actionCount: cat.actionCount,
        adminItem: null,
        actionDbId: cat.id,
      });
    }

    for (const item of this.items) {
      const key = item.nom.trim().toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        key: `admin-${item.id}`,
        name: item.nom,
        description: item.description ?? existing?.description,
        imageUrl: item.imageUrl ?? existing?.imageUrl,
        published: item.published ?? existing?.published,
        actionCount: existing?.actionCount ?? 0,
        adminItem: item,
        actionDbId: existing?.actionDbId,
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
  }

  isCardSelected(card: CategoryCardView): boolean {
    if (card.adminItem && this.editingId === card.adminItem.id) {
      return true;
    }
    return (
      this.editingActionDbOnly != null &&
      this.editingActionDbOnly.trim().toLowerCase() === card.name.trim().toLowerCase()
    );
  }

  cardStatusLabel(card: CategoryCardView): string {
    return card.published !== false ? 'PUBLIÉE' : 'BROUILLON';
  }

  findAdminItem(actionDbName: string): AdminCategorie | null {
    const normalized = actionDbName.trim().toLowerCase();
    return this.items.find((item) => item.nom.trim().toLowerCase() === normalized) ?? null;
  }

  hasCategoryImage(imageUrl?: string | null): boolean {
    return !!imageUrl?.trim();
  }

  categoryImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl?.trim()) {
      return null;
    }
    return this.resolveImageUrl(imageUrl);
  }

  formPanelTitle(): string {
    if (this.editingId != null) {
      return 'Modifier la catégorie';
    }
    if (this.editingActionDbOnly) {
      return `Modifier « ${this.editingActionDbOnly} »`;
    }
    return 'Nouvelle catégorie';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    input.value = '';

    this.imageUploadError = '';
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.imageUploadError = 'Formats acceptés : JPG, PNG ou WEBP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.imageUploadError = 'Image trop volumineuse (maximum 5 Mo).';
      return;
    }

    this.uploadingImage = true;
    this.imageFileName = file.name;
    const localPreview = URL.createObjectURL(file);
    this.imagePreview = localPreview;

    this.admin.uploadCategoryImage(file).subscribe({
      next: (res) => {
        this.uploadingImage = false;
        this.form.imageUrl = res.imageUrl;
        if (this.imagePreview?.startsWith('blob:')) {
          URL.revokeObjectURL(this.imagePreview);
        }
        this.imagePreview = this.resolveImageUrl(res.imageUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.uploadingImage = false;
        if (this.imagePreview?.startsWith('blob:')) {
          URL.revokeObjectURL(this.imagePreview);
        }
        this.imagePreview = null;
        this.imageFileName = '';
        this.form.imageUrl = '';
        this.imageUploadError = this.extractError(err, "Impossible d'envoyer l'image.");
      },
    });
  }

  removeSelectedImage(): void {
    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = null;
    this.imageFileName = '';
    this.form.imageUrl = '';
    this.imageUploadError = '';
  }

  previewSrc(): string | null {
    return this.imagePreview;
  }

  private resolveImageUrl(url: string): string {
    const trimmed = url.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return '/' + trimmed;
  }

  private resetForm(): void {
    this.removeSelectedImage();
    this.form = this.emptyForm();
  }

  private emptyForm(): AdminCategorieRequest {
    return { nom: '', description: '', imageUrl: '', published: true };
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
