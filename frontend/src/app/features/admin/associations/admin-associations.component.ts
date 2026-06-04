import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { map, of, switchMap, catchError } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminAssociationProfile,
  AdminAssociationProfileRequest,
} from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-associations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-associations.component.html',
  styleUrl: './admin-associations.component.scss',
})
export class AdminAssociationsComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  message = '';
  formError = '';
  search = '';
  items: AdminAssociationProfile[] = [];
  editingId: number | null = null;

  form: AdminAssociationProfileRequest = this.emptyForm();
  logoFile: File | null = null;
  logoPreview: string | null = null;
  existingLogoUrl: string | null = null;
  logoError = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
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

  startCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.clearLogoSelection();
    this.existingLogoUrl = null;
    this.message = '';
    this.formError = '';
  }

  startEdit(item: AdminAssociationProfile): void {
    this.editingId = item.id;
    this.message = '';
    this.clearLogoSelection();
    this.admin.getAssociationProfile(item.id).subscribe({
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
    this.formError = '';
    this.message = '';
    const name = this.form.name?.trim() ?? '';
    const email = this.form.email?.trim() ?? '';
    if (!name || !email) {
      this.formError = 'Nom et e-mail sont obligatoires.';
      this.scrollToFormFeedback();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError = 'E-mail invalide (ex. contact@association.ma).';
      this.scrollToFormFeedback();
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

    if (this.editingId == null) {
      if (this.form.password?.trim()) {
        body.password = this.form.password.trim();
      }
    }

    const isEdit = this.editingId != null;
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
          this.editingId = null;
          this.form = this.emptyForm();
          this.clearLogoSelection();
          this.existingLogoUrl = null;
          this.reload();
          this.scrollToFormFeedback();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.formError = this.extractError(err, 'Enregistrement impossible.');
          this.scrollToFormFeedback();
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

  private scrollToFormFeedback(): void {
    setTimeout(() => {
      document.getElementById('association-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }
}
