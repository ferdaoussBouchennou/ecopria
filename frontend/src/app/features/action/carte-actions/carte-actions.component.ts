import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-carte-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="carte-placeholder">
      <div class="carte-inner">
        <span class="carte-icon">🗺</span>
        <h2>Carte interactive</h2>
        <p>La carte des actions écologiques sera disponible prochainement.</p>
        <a routerLink="/actions" class="btn-back">← Voir la liste des actions</a>
      </div>
    </div>
  `,
  styles: [`
    .carte-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
    }
    .carte-inner {
      text-align: center;
      max-width: 400px;
    }
    .carte-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    h2 { font-family: var(--ec-font-serif); font-size: 1.75rem; margin: 0 0 0.75rem; }
    p { color: var(--ec-text-muted); margin-bottom: 1.5rem; }
    .btn-back {
      display: inline-block;
      padding: 0.65rem 1.25rem;
      background: var(--ec-sage);
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-size: 0.875rem;
    }
  `]
})
export class CarteActionsComponent {}
