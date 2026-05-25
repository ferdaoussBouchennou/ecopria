import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-association-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './association-shell.component.html',
  styleUrls: ['./association-shell.component.css']
})
export class AssociationShellComponent implements OnInit {
  associationName: string = '';
  associationId: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Récupérer les infos de l'association depuis le service d'authentification
    // Pour l'instant, données mockées
    this.loadAssociationInfo();
  }

  loadAssociationInfo(): void {
    // TODO: Remplacer par un vrai appel API
    // this.authService.getCurrentAssociation().subscribe(...)
    
    // Mock data pour le développement
    this.associationName = 'Méditerranée Propre';
    this.associationId = 1;
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    // TODO: Implémenter la déconnexion
    if (confirm('Voulez-vous vous déconnecter ?')) {
      // this.authService.logout();
      this.router.navigate(['/actions']);
    }
  }
}
