import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import { AdminCategorie, AdminCategorieRequest } from '../../../core/models/admin.model';
import { SITE_IMAGES } from '../../../core/constants/site-images';
import { getCategoryMeta } from '../../action/constants/category-meta';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  message = '';
  items: AdminCategorie[] = [];

  form: AdminCategorieRequest = this.emptyForm();
  imagePreview: string | null = null;
  imageFileName = '';
  uploadingImage = false;
  imageUploadError = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
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
  }

  create(): void {
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
      published: true,
    };
    this.admin.createCategory(body).subscribe({
      next: () => {
        this.saving = false;
        this.message = `Catégorie « ${body.nom} » créée.`;
        this.resetForm();
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = this.extractError(err, 'Création impossible.');
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
    if (!confirm(`Supprimer la catégorie « ${item.nom} » ?`)) {
      return;
    }
    this.admin.deleteCategory(item.id).subscribe({
      next: () => {
        this.message = `Catégorie « ${item.nom} » supprimée.`;
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.extractError(
          err,
          'Suppression impossible (catégorie peut-être utilisée par des actions).'
        );
      },
    });
  }

  imageSrc(item: AdminCategorie): string {
    if (item.imageUrl?.trim()) {
      const url = item.imageUrl.trim();
      if (url.startsWith('http') || url.startsWith('/')) {
        return url;
      }
      return '/' + url;
    }
    const slug = getCategoryMeta(item.nom).slug;
    const fallback = SITE_IMAGES.categories[slug as keyof typeof SITE_IMAGES.categories];
    return fallback ?? SITE_IMAGES.categories.nettoyage;
  }

  statusLabel(item: AdminCategorie): string {
    return item.published !== false ? 'PUBLIÉE' : 'BROUILLON';
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
        this.imagePreview = res.imageUrl;
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
    if (!this.imagePreview) {
      return null;
    }
    if (this.imagePreview.startsWith('blob:') || this.imagePreview.startsWith('http')) {
      return this.imagePreview;
    }
    return this.imagePreview.startsWith('/') ? this.imagePreview : '/' + this.imagePreview;
  }

  private resetForm(): void {
    this.removeSelectedImage();
    this.form = this.emptyForm();
  }

  private emptyForm(): AdminCategorieRequest {
    return { nom: '', description: '', imageUrl: '' };
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
