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
  loading = true;
  saving = false;
  erreur = '';
  succes = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.partenaireService.getProfil().subscribe({
      next: (p) => {
        this.profil = p;
        this.form = {
          name: p.name,
          category: p.category,
          address: p.address,
          city: p.city,
          description: p.description,
          imageUrl: p.imageUrl
        };
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  enregistrer(): void {
    this.saving = true;
    this.succes = '';
    this.erreur = '';
    this.partenaireService.updateProfil(this.form).subscribe({
      next: (p) => {
        this.profil = p;
        this.succes = 'Profil enregistré.';
        this.saving = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.saving = false;
      }
    });
  }
}
