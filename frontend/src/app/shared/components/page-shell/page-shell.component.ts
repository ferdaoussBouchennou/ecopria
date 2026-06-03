import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { defaultHomeForRole } from '../../../core/utils/auth-navigation.util';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss',
})
export class PageShellComponent {
  constructor(public auth: AuthService) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get monEspaceLink(): string[] {
    const path = defaultHomeForRole(this.auth.getRole());
    return [path];
  }

  get recompensesLink(): string[] {
    if (this.auth.getRole() === 'USER') {
      return ['/espace/recompenses'];
    }
    return ['/connexion'];
  }
}
