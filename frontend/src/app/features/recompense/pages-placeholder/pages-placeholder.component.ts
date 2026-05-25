import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-partenaire-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="placeholder-page">
      <span class="page-label">{{ label }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-sub">{{ description }}</p>
      <div class="card placeholder-card">
        <p>Cette section sera connectée aux microservices dédiés (avis, analytics visibilité, profil public catalogue).</p>
        <a routerLink="/partenaire" class="btn btn--outline">← Tableau de bord</a>
      </div>
    </div>
  `,
  styles: [`
    @import '../partenaire-shared';
    .placeholder-card {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 520px;
    }
    .placeholder-card p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--ec-text-soft);
      line-height: 1.6;
    }
  `]
})
export class PartenairePlaceholderComponent {
  @Input() label = '';
  @Input() title = '';
  @Input() description = '';
}
