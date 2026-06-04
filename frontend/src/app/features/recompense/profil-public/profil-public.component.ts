import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { from, of } from 'rxjs';
import { catchError, concatMap, switchMap, toArray } from 'rxjs/operators';
import { PartenaireService } from '../partenaire.service';
import { PartenaireProfil, UpdatePartenaireProfil } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-profil-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil-public.component.html',
  styleUrls: ['./profil-public.component.scss']
})
export class ProfilPublicComponent implements OnInit {
  readonly MAX_GALLERY = 3;

  profil: PartenaireProfil | null = null;
  form: UpdatePartenaireProfil = {};
  coverFile: File | null = null;
  coverPreview: string | null = null;
  loading = true;
  saving = false;
  uploadingGallery = false;
  galleryUploadProgress = '';
  erreur = '';
  succes = '';
  uploadError = '';

  categories = [
    'Restauration', 'Épicerie & alimentation', 'Bien-être & santé',
    'Artisanat & culture', 'Mode & textile', 'Éducation',
    'Sport & loisirs', 'Services', 'Agriculture & jardinage', 'Autre'
  ];

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.partenaireService.getProfil().subscribe({
      next: (p) => {
        this.profil = p;
        this.form = {
          name:        p.name,
          category:    p.category,
          address:     p.address,
          city:        p.city,
          description: p.description,
          galleryImages: (p.galleryImages ?? []).slice(0, this.MAX_GALLERY),
          phone: p.phone,
          website: p.website,
          instagramUrl: p.instagramUrl,
          facebookUrl: p.facebookUrl,
          openingHours: p.openingHours
        };
        this.coverPreview = p.imageUrl ?? null;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  get galleryCount(): number {
    return this.form.galleryImages?.length ?? 0;
  }

  get gallerySlotsRemaining(): number {
    return Math.max(0, this.MAX_GALLERY - this.galleryCount);
  }

  get emptyGallerySlots(): number[] {
    return Array.from({ length: this.gallerySlotsRemaining });
  }

  get profileCompletion(): number {
    const checks = [
      !!this.form.name?.trim(),
      !!this.form.category?.trim(),
      !!this.form.description?.trim(),
      !!this.form.city?.trim(),
      !!this.coverPreview,
      this.galleryCount > 0,
      !!this.form.phone?.trim(),
      !!this.form.openingHours?.trim()
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file)) return;
    this.coverFile = file;
    if (this.coverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.coverPreview);
    }
    this.coverPreview = URL.createObjectURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    const remaining = this.gallerySlotsRemaining;
    if (remaining <= 0) {
      this.uploadError = `Maximum ${this.MAX_GALLERY} photos dans la galerie.`;
      input.value = '';
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      if (!this.validateImageFile(file)) {
        input.value = '';
        return;
      }
    }

    this.uploadingGallery = true;
    this.uploadError = '';
    this.galleryUploadProgress = `Envoi 0 / ${toUpload.length}…`;

    let done = 0;
    from(toUpload).pipe(
      concatMap((file) =>
        this.partenaireService.uploadProfilGallery(file).pipe(
          switchMap((res) => {
            done += 1;
            this.galleryUploadProgress = `Envoi ${done} / ${toUpload.length}…`;
            this.form.galleryImages = [...(this.form.galleryImages ?? []), res.imageUrl].slice(0, this.MAX_GALLERY);
            return of(res);
          })
        )
      ),
      toArray(),
      catchError((e: Error) => {
        this.uploadError = e.message;
        this.uploadingGallery = false;
        this.galleryUploadProgress = '';
        input.value = '';
        return of([]);
      })
    ).subscribe({
      next: () => {
        this.uploadingGallery = false;
        this.galleryUploadProgress = '';
        input.value = '';
      }
    });
  }

  removeGalleryImage(url: string): void {
    this.form.galleryImages = (this.form.galleryImages ?? []).filter((u) => u !== url);
    this.uploadError = '';
  }

  private validateImageFile(file: File): boolean {
    this.uploadError = '';
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.uploadError = 'Format non supporté. Utilisez JPG, PNG ou WEBP.';
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Fichier trop volumineux (maximum 5 Mo).';
      return false;
    }
    return true;
  }

  enregistrer(): void {
    if (!this.form.name?.trim()) {
      this.erreur = 'Le nom de l\'enseigne est obligatoire.';
      return;
    }
    this.saving  = true;
    this.succes  = '';
    this.erreur  = '';

    const saveProfil$ = this.coverFile
      ? this.partenaireService.uploadProfilCover(this.coverFile).pipe(
          switchMap((res) => {
            this.coverPreview = res.imageUrl;
            this.coverFile = null;
            return this.partenaireService.updateProfil(this.buildProfilDto());
          })
        )
      : this.partenaireService.updateProfil(this.buildProfilDto());

    saveProfil$.subscribe({
      next: (p) => {
        this.profil = p;
        this.coverPreview = p.imageUrl ?? this.coverPreview;
        this.form.galleryImages = (p.galleryImages ?? []).slice(0, this.MAX_GALLERY);
        this.succes = 'Profil enregistré avec succès !';
        this.saving = false;
        this.partenaireService.notifyProfilUpdated();
        setTimeout(() => (this.succes = ''), 4000);
      },
      error: (e: Error) => {
        this.erreur  = e.message;
        this.saving  = false;
      }
    });
  }

  private buildProfilDto(): UpdatePartenaireProfil {
    return {
      name: this.form.name,
      category: this.form.category,
      address: this.form.address,
      city: this.form.city,
      description: this.form.description,
      galleryImages: (this.form.galleryImages ?? []).slice(0, this.MAX_GALLERY),
      phone: this.form.phone,
      website: this.form.website,
      instagramUrl: this.form.instagramUrl,
      facebookUrl: this.form.facebookUrl,
      openingHours: this.form.openingHours
    };
  }

  voirPagePublique(): void {
    if (this.profil) {
      window.open(`/partenaires/${this.profil.userId}`, '_blank');
    }
  }

  onImgError(event: Event): void {
    const el = event.target as HTMLImageElement;
    el.style.display = 'none';
  }
}
