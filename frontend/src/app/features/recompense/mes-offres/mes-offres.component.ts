import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { Recompense } from '../../../core/models/recompense.model';

type Filtre = 'TOUS' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-mes-offres',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mes-offres.component.html',
  styleUrls: ['./mes-offres.component.scss']
})
export class MesOffresComponent implements OnInit {
  offres: Recompense[] = [];
  loading = true;
  erreur = '';
  desactivationId: number | null = null;
  suppressionId: number | null = null;
  filtre: Filtre = 'TOUS';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreur  = '';
    this.partenaireService.getMesOffres().subscribe({
      next: (list) => {
        this.offres  = list;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur  = e.message;
        this.loading = false;
      }
    });
  }

  get offresActives(): Recompense[] {
    return this.offres.filter((o) => o.isActive);
  }

  get offresInactives(): Recompense[] {
    return this.offres.filter((o) => !o.isActive);
  }

  get offresFiltered(): Recompense[] {
    switch (this.filtre) {
      case 'ACTIVE':   return this.offresActives;
      case 'INACTIVE': return this.offresInactives;
      default:         return this.offres;
    }
  }

  toggleActif(o: Recompense): void {
    this.desactivationId = o.id;
    this.partenaireService.toggleOffreActive(o.id).subscribe({
      next: (updated) => {
        this.offres          = this.offres.map((x) => (x.id === o.id ? updated : x));
        this.desactivationId = null;
      },
      error: (e: Error) => {
        alert(e.message);
        this.desactivationId = null;
      }
    });
  }

  confirmerSuppression(o: Recompense): void {
    this.suppressionId = o.id;
  }

  annulerSuppression(): void {
    this.suppressionId = null;
  }

  supprimerConfirme(): void {
    if (this.suppressionId === null) return;
    const id = this.suppressionId;
    this.partenaireService.desactiverOffre(id).subscribe({
      next: () => {
        this.offres        = this.offres.filter((x) => x.id !== id);
        this.suppressionId = null;
      },
      error: (e: Error) => {
        alert(e.message);
        this.suppressionId = null;
      }
    });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      STOCK:      'Stock',
      REDUCTION:  'Réduction',
      SERVICE:    'Service',
      EXPERIENCE: 'Expérience'
    };
    return map[type] ?? type;
  }

  typeClass(type: string): string {
    const map: Record<string, string> = {
      STOCK:      'type--stock',
      REDUCTION:  'type--reduction',
      SERVICE:    'type--service',
      EXPERIENCE: 'type--experience'
    };
    return map[type] ?? '';
  }
}
