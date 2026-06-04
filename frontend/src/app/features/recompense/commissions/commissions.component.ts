import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { CommissionMensuelle } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './commissions.component.html',
  styleUrls: ['./commissions.component.scss']
})
export class CommissionsComponent implements OnInit {
  commissions: CommissionMensuelle[] = [];
  aRegler  = 0;
  commissionMoisEnCours = 0;
  tauxCommission = 0;  // Taux de commission du partenaire
  loading  = true;
  erreur   = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreur  = '';

    // Dashboard pour le total à régler ce mois ET le taux de commission
    this.partenaireService.getDashboard().subscribe({
      next: (d) => { 
        this.aRegler = d.commissionsARegler;
        this.tauxCommission = d.commissionRate || 0;
      }
    });

    // Historique mensuel détaillé
    this.partenaireService.getCommissions().subscribe({
      next: (list) => {
        this.commissions = list;
        this.calculerCommissionMoisEnCours();
        this.loading     = false;
      },
      error: (e: Error) => {
        this.erreur  = e.message;
        this.loading = false;
      }
    });
  }

  private calculerCommissionMoisEnCours(): void {
    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const commissionCeMois = this.commissions.find(c => c.mois === moisActuel);
    this.commissionMoisEnCours = commissionCeMois ? commissionCeMois.commission : 0;
  }

  formatMois(mois: string): string {
    const [y, m] = mois.split('-');
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return `${months[Number(m) - 1] ?? m} ${y}`;
  }

  get moisActuel(): string {
    const now = new Date();
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  get totalCoupons(): number {
    return this.commissions.reduce((s, c) => s + c.couponsUtilises, 0);
  }

  get totalCa(): number {
    return this.commissions.reduce((s, c) => s + c.caGenere, 0);
  }

  get totalCommissions(): number {
    return this.commissions.reduce((s, c) => s + c.commission, 0);
  }
}
