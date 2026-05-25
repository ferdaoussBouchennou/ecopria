import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartenaireService } from '../partenaire.service';
import { CommissionMensuelle } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commissions.component.html',
  styleUrls: ['./commissions.component.scss']
})
export class CommissionsComponent implements OnInit {
  commissions: CommissionMensuelle[] = [];
  aRegler = 0;
  loading = true;
  erreur = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.partenaireService.getDashboard().subscribe({
      next: (d) => {
        this.aRegler = d.commissionsARegler;
      }
    });

    this.partenaireService.getCommissions().subscribe({
      next: (list) => {
        this.commissions = list;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  formatMois(mois: string): string {
    const [y, m] = mois.split('-');
    const months = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    return `${months[Number(m) - 1] ?? m} ${y}`;
  }
}
