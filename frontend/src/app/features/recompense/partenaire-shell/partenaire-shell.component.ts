import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PartenaireService } from '../partenaire.service';
import { PartenaireProfil } from '../../../core/models/recompense.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-partenaire-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './partenaire-shell.component.html',
  styleUrls: ['./partenaire-shell.component.scss']
})
export class PartenaireShellComponent implements OnInit {
  profil: PartenaireProfil | null = null;
  partenaireName = 'Mon établissement';
  partenaireLogo = '';
  profileLoadError = '';
  sidebarOpen = false;

  constructor(
    private partenaireService: PartenaireService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfil();
    this.partenaireService.onProfilUpdated().subscribe(() => this.loadProfil());

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarOpen = false;
    });
  }

  loadProfil(): void {
    this.partenaireService.getProfil().subscribe({
      next: (p) => {
        this.profil = p;
        this.partenaireName = p.name?.trim() || 'Mon établissement';
        this.partenaireLogo = p.imageUrl?.trim() || '';
        this.profileLoadError = '';
      },
      error: (e: Error) => {
        this.profileLoadError = e.message;
      }
    });
  }

  getInitials(): string {
    return this.initialsFrom(this.partenaireName);
  }

  private initialsFrom(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'P';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  logout(): void {
    if (confirm('Voulez-vous vous déconnecter ?')) {
      this.auth.logout();
      void this.router.navigate(['/']);
    }
  }
}
