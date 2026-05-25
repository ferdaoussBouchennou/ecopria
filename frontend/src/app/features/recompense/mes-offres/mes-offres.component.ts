import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { Recompense } from '../../../core/models/recompense.model';

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

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreur = '';
    this.partenaireService.getMesOffres().subscribe({
      next: (list) => {
        this.offres = list;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  toggleActif(o: Recompense): void {
    this.desactivationId = o.id;
    this.partenaireService.toggleOffreActive(o.id).subscribe({
      next: (updated) => {
        this.offres = this.offres.map((x) => (x.id === o.id ? updated : x));
        this.desactivationId = null;
      },
      error: (e: Error) => {
        alert(e.message);
        this.desactivationId = null;
      }
    });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      STOCK: 'Stock',
      REDUCTION: 'Réduction',
      SERVICE: 'Service',
      EXPERIENCE: 'Expérience'
    };
    return map[type] ?? type;
  }
}
