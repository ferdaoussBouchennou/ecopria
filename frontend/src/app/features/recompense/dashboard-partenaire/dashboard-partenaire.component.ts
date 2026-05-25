import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { DashboardPartenaire } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-dashboard-partenaire',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-partenaire.component.html',
  styleUrls: ['./dashboard-partenaire.component.scss']
})
export class DashboardPartenaireComponent implements OnInit {
  data: DashboardPartenaire | null = null;
  loading = true;
  erreur = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreur = '';
    this.partenaireService.getDashboard().subscribe({
      next: (d) => {
        this.data = d;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  statutLabel(status: string): string {
    const map: Record<string, string> = {
      DISTRIBUE: 'Distribué',
      UTILISE: 'Utilisé',
      EXPIRE: 'Expiré'
    };
    return map[status] ?? status;
  }
}
