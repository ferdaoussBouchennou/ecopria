import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss',
})
export class PageShellComponent {
  constructor(public auth: AuthService, private router: Router) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get monEspaceLink(): string[] {
    const role = this.auth.getRole();
    if (role === 'ASSOCIATION') {
      return ['/association'];
    }
    if (role === 'PARTNER') {
      return ['/partenaire'];
    }
    return ['/espace', 'dashboard'];
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/connexion']);
  }
}
