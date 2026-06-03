import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  profil: PartenaireProfil | null = null;
  form: UpdatePartenaireProfil = {};
  galleryText = '';
  loading = true;
  saving = false;
  erreur = '';
  succes = '';

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
          imageUrl:    p.imageUrl,
          galleryImages: p.galleryImages ?? [],
          phone: p.phone,
          website: p.website,
          instagramUrl: p.instagramUrl,
          facebookUrl: p.facebookUrl,
          openingHours: p.openingHours
        };
        this.galleryText = (p.galleryImages ?? []).join('\n');
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  enregistrer(): void {
    if (!this.form.name?.trim()) {
      this.erreur = 'Le nom de l\'enseigne est obligatoire.';
      return;
    }
    this.saving  = true;
    this.succes  = '';
    this.erreur  = '';
    const galleryImages = this.galleryText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line);

    this.form.galleryImages = galleryImages;
    this.partenaireService.updateProfil(this.form).subscribe({
      next: (p) => {
        this.profil = p;
        this.galleryText = (p.galleryImages ?? []).join('\n');
        this.succes = 'Profil enregistré avec succès !';
        this.saving = false;
        setTimeout(() => (this.succes = ''), 4000);
      },
      error: (e: Error) => {
        this.erreur  = e.message;
        this.saving  = false;
      }
    });
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
