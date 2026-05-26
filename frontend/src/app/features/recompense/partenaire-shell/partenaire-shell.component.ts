import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PartenaireService } from '../partenaire.service';
import { PartenaireProfil } from '../../../core/models/recompense.model';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-partenaire-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './partenaire-shell.component.html',
  styleUrls: ['./partenaire-shell.component.scss']
})
export class PartenaireShellComponent implements OnInit {
  profil: PartenaireProfil | null = null;
  sidebarOpen = false;

  navItems: NavItem[] = [
    { path: '/partenaire', label: 'Tableau de bord', icon: '◈' },
    { path: '/partenaire/offres', label: 'Mes offres', icon: '🎁' },
    { path: '/partenaire/scanner', label: 'Scanner coupon', icon: '📱' },
    { path: '/partenaire/avis', label: 'Avis clients', icon: '⭐' },
    { path: '/partenaire/visibilite', label: 'Visibilité', icon: '📈' },
    { path: '/partenaire/commissions', label: 'Commissions', icon: '💰' },
    { path: '/partenaire/profil', label: 'Mon profil', icon: '👤' },
  ];

  constructor(private partenaireService: PartenaireService, private router: Router) {}

  ngOnInit(): void {
    this.partenaireService.getProfil().subscribe({
      next: (p) => (this.profil = p),
      error: () => {}
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarOpen = false;
    });
  }

  isActive(path: string): boolean {
    if (path === '/partenaire') return this.router.url === '/partenaire';
    return this.router.url.startsWith(path);
  }
}
