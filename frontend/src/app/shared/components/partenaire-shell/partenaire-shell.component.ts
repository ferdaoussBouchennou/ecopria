import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PartenaireService } from '../../../features/recompense/partenaire.service';

@Component({
  selector: 'app-partenaire-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './partenaire-shell.component.html',
  styleUrls: ['./partenaire-shell.component.scss']
})
export class PartenaireShellComponent implements OnInit {
  partenaireName = 'Partenaire';
  loadingName = true;

  readonly navItems = [
    { path: '/partenaire', label: 'Tableau de bord', exact: true },
    { path: '/partenaire/profil', label: 'Profil public', exact: false },
    { path: '/partenaire/offres', label: 'Mes offres', exact: false },
    { path: '/partenaire/scanner', label: 'Scanner', exact: false },
    { path: '/partenaire/avis', label: 'Avis clients', exact: false },
    { path: '/partenaire/visibilite', label: 'Visibilité', exact: false },
    { path: '/partenaire/commissions', label: 'Commissions', exact: false }
  ];

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.partenaireService.getDashboard().subscribe({
      next: (d) => {
        this.partenaireName = d.partenaireName;
        this.loadingName = false;
      },
      error: () => {
        this.partenaireName = 'Mon commerce';
        this.loadingName = false;
      }
    });
  }
}
