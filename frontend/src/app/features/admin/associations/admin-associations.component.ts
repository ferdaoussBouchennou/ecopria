import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { map, of, switchMap, catchError } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminAssociationProfile,
  AdminAssociationProfileRequest,
} from '../../../core/models/admin.model';

type FormMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-admin-associations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-associations.component.html',
  styleUrl: './admin-associations.component.scss',
})
export class AdminAssociationsComponent implements OnInit, OnDestroy {
  loading = true;
  saving = false;
  error = '';
  message = '';
  formError = '';
  search = '';
  items: AdminAssociationProfile[] = [];
  editingId: number | null = null;
  formVisible = false;
  formMode: FormMode = 'create';

  form: AdminAssociationProfileRequest = this.emptyForm();
  logoFile: File | null = null;
  logoPreview: string | null = null;
  existingLogoUrl: string | null = null;
  logoError = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.clearLogoSelection();
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.formVisible && !this.saving) {
      this.closeForm();
    }
  }

  get isFormReadonly(): boolean {
    return this.formMode === 'view';
  }

  get formTitle(): string {
    if (this.formMode === 'view') {
      return 'Détail de l’association';
    }
    if (this.formMode === 'edit') {
      return 'Modifier l’association';
    }
    return 'Nouvelle association';
  }

  get filteredItems(): AdminAssociationProfile[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.email ?? '').toLowerCase().includes(q) ||
        (item.city ?? '').toLowerCase().includes(q)
    );
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.admin.getAssociationProfiles().subscribe({
      next: (list) => {
        this.items = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error =
          'Impossible de charger les associations. Vérifiez admin-service, auth-service et service-action.';
      },
    });
  }

  openCreate(): void {
    this.resetFormState();
    this.formVisible = true;
    this.formMode = 'create';
    this.lockBodyScroll();
  }

  viewItem(item: AdminAssociationProfile): void {
    this.resetFormState();
    this.editingId = item.id;
    this.formVisible = true;
    this.formMode = 'view';
    this.lockBodyScroll();
    this.loadDetail(item.id);
  }

  editItem(item: AdminAssociationProfile): void {
    this.resetFormState();
    this.editingId = item.id;
    this.formVisible = true;
    this.formMode = 'edit';
    this.lockBodyScroll();
    this.loadDetail(item.id);
  }

  switchToEdit(): void {
    if (this.formMode === 'view') {
      this.formMode = 'edit';
    }
  }

  closeForm(): void {
    this.formVisible = false;
    this.resetFormState();
    this.formError = '';
    document.body.style.overflow = '';
  }

  private resetFormState(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.clearLogoSelection();
    this.existingLogoUrl = null;
    this.formError = '';
  }

  private loadDetail(id: number): void {
    this.admin.getAssociationProfile(id).subscribe({
      next: (detail) => {
        this.form = {
          name: detail.name ?? '',
          email: detail.email ?? '',
          phone: detail.phone ?? '',
          address: detail.address ?? '',
          city: detail.city ?? '',
          description: detail.description ?? '',
          logoUrl: detail.logoUrl ?? '',
          validated: detail.validated !== false,
        };
        this.existingLogoUrl = detail.logoUrl ?? null;
      },
      error: () => {
        this.message = 'Impossible de charger le détail de l’association.';
        this.closeForm();
      },
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.logoError = '';
    if (!file) {
      return;
    }
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.logoError = 'Format accepté : JPG, PNG ou WEBP.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.logoError = 'Logo trop volumineux (5 Mo max).';
      input.value = '';
      return;
    }
    if (this.logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreview);
    }
    this.logoFile = file;
    this.logoPreview = URL.createObjectURL(file);
  }

  clearLogoSelection(): void {
    if (this.logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreview);
    }
    this.logoFile = null;
    this.logoPreview = null;
    this.logoError = '';
  }

  submit(): void {
    if (this.isFormReadonly) {
      return;
    }
    this.formError = '';
    this.message = '';
    const name = this.form.name?.trim() ?? '';
    const email = this.form.email?.trim() ?? '';
    if (!name || !email) {
      this.formError = 'Nom et e-mail sont obligatoires.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError = 'E-mail invalide (ex. contact@association.ma).';
      return;
    }

    const body: AdminAssociationProfileRequest = {
      name,
      email,
      phone: this.form.phone?.trim() || undefined,
      address: this.form.address?.trim() || undefined,
      city: this.form.city?.trim() || undefined,
      description: this.form.description?.trim() || undefined,
      logoUrl: this.form.logoUrl?.trim() || undefined,
      validated: this.form.validated !== false,
    };

    if (this.formMode === 'create' && this.form.password?.trim()) {
      body.password = this.form.password.trim();
    }

    const isEdit = this.formMode === 'edit' && this.editingId != null;
    this.saving = true;

    const save$ = isEdit
      ? this.admin.updateAssociationProfile(this.editingId!, body)
      : this.admin.createAssociationProfile(body);

    save$
      .pipe(
        switchMap((saved) => {
          if (this.logoFile) {
            return this.admin.uploadAssociationLogo(saved.id, this.logoFile).pipe(
              map(() => saved),
              catchError((logoErr: HttpErrorResponse) => {
                const logoMsg = this.extractError(logoErr, 'Envoi du logo impossible.');
                return of({
                  ...saved,
                  temporaryPassword: saved.temporaryPassword
                    ? `${saved.temporaryPassword} (logo non envoyé : ${logoMsg})`
                    : undefined,
                  _logoWarning: logoMsg,
                } as AdminAssociationProfile & { _logoWarning?: string });
              })
            );
          }
          return of(saved);
        })
      )
      .subscribe({
        next: (saved) => {
          this.saving = false;
          const logoWarning = (saved as AdminAssociationProfile & { _logoWarning?: string })._logoWarning;
          if (saved.temporaryPassword) {
            this.message = `Association créée. Mot de passe temporaire : ${saved.temporaryPassword}`;
          } else if (logoWarning) {
            this.message = `Association enregistrée, mais logo non envoyé : ${logoWarning}`;
          } else if (!isEdit && !saved.temporaryPassword) {
            this.message =
              'Association créée. Un compte existait déjà avec cet e-mail — le profil a été complété.';
          } else {
            this.message = isEdit ? 'Association mise à jour.' : 'Association créée.';
          }
          this.closeForm();
          this.reload();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.formError = this.extractError(err, 'Enregistrement impossible.');
        },
      });
  }

  logoSrc(item: AdminAssociationProfile): string | null {
    const url = item.logoUrl?.trim();
    if (!url) {
      return null;
    }
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    return '/' + url;
  }

  previewLogo(): string | null {
    if (this.logoPreview) {
      return this.logoPreview;
    }
    if (this.existingLogoUrl) {
      return this.logoSrc({ logoUrl: this.existingLogoUrl } as AdminAssociationProfile);
    }
    return null;
  }

  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private emptyForm(): AdminAssociationProfileRequest {
    return {
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      city: '',
      description: '',
      validated: true,
    };
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 0) {
      return 'Service indisponible. Vérifiez que admin-service (8087), auth (8081), utilisateur (8082) et action (9090) sont démarrés.';
    }
    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.message) {
      return body.message;
    }
    if (body?.detail) {
      return body.detail;
    }
    return fallback;
  }
}
