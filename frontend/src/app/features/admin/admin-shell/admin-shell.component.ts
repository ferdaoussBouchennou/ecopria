import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent implements OnInit {
  sidebarOpen = false;
  adminEmail = 'admin@ecopria.local';
  adminInitials = 'AD';

  navItems: NavItem[] = [
    { path: '/admin', label: 'Vue globale' },
    { path: '/admin/comptes', label: 'Validation comptes' },
    { path: '/admin/actions-fixes', label: 'Actions fixes' },
    { path: '/admin/categories', label: 'Catégories' },
    { path: '/admin/moderation', label: 'Modération' },
    { path: '/admin/users', label: 'Utilisateurs' },
    { path: '/admin/configurations', label: 'Configurations' },
    { path: '/admin/logs', label: 'Logs' },
  ];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminEmail = localStorage.getItem('ecopria_admin_email') ?? this.adminEmail;
    this.adminInitials = this.initialsFromEmail(this.adminEmail);

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarOpen = false;
      });
  }

  logout(): void {
    this.auth.clearSession();
    void this.router.navigate(['/connexion']);
  }

  isActive(path: string): boolean {
    if (path === '/admin') {
      return this.router.url === '/admin' || this.router.url === '/admin/';
    }
    return this.router.url.startsWith(path);
  }

  private initialsFromEmail(email: string): string {
    const local = email.split('@')[0] ?? 'AD';
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
}
