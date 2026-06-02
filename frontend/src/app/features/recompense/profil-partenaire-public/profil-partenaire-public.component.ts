import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { PartenaireProfil } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-profil-partenaire-public',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profil-partenaire-public.component.html',
  styleUrls: ['./profil-partenaire-public.component.scss']
})
export class ProfilPartenairePublicComponent implements OnInit {
  profil: PartenaireProfil | null = null;
  loading = true;
  erreur = '';

  constructor(
    private route: ActivatedRoute,
    private partenaireService: PartenaireService
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('userId');
    const userId = Number(rawId);
    if (!userId || Number.isNaN(userId)) {
      this.erreur = 'Identifiant partenaire invalide.';
      this.loading = false;
      return;
    }

    this.partenaireService.getProfilPublic(userId).subscribe({
      next: (profil) => {
        this.profil = profil;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }
}
