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
      day: 'numeric', month: 'short'
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

  statutClass(status: string): string {
    const map: Record<string, string> = {
      DISTRIBUE: 'badge--orange',
      UTILISE: 'badge--green',
      EXPIRE: 'badge--muted'
    };
    return map[status] ?? 'badge--muted';
  }

  get kpis() {
    if (!this.data) return [];
    return [
      { label: 'Vues profil public', value: this.data.vuesProfil ?? 0, format: 'number' },
      { label: 'Clics vers offres',  value: this.data.clicsOffres ?? 0,  format: 'number' },
      { label: 'Coupons distribués', value: this.data.couponsDistribues,      format: 'number' },
      { label: 'Coupons utilisés',   value: this.data.couponsUtilises,        format: 'number' },
      { label: 'Taux conversion',    value: this.data.tauxUtilisation,        format: 'percent' },
      { label: 'Note moyenne',       value: this.data.noteMoyenne ?? null,    format: 'rating' },
      { label: 'Nombre d\'avis',     value: this.data.nombreAvis ?? 0,        format: 'number' },
      { label: 'Commissions à régler', value: this.data.commissionsARegler,   format: 'currency' },
    ];
  }

  formatKpi(value: number | null, format: string): string {
    if (value === null || value === undefined) return '—';
    switch (format) {
      case 'percent':  return `${value}%`;
      case 'currency': return `${Math.round(value)} DH`;
      case 'rating':   return `${value}`;
      default:         return value.toLocaleString('fr-FR');
    }
  }
}
