import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PresenceService } from '../../../presence/presence.service';
import { DevContextService } from '../../../../core/services/dev-context.service';

@Component({
  selector: 'app-scan-participant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="scan-page">
      <header class="page-header">
        <a routerLink="/mes-inscriptions" class="back-link">← Retour à mes inscriptions</a>
        <h1 class="page-title">Valider ma présence</h1>
        <p class="page-sub">Entrez le code PIN fourni par l'organisateur pour confirmer votre participation.</p>
      </header>

      <div class="scan-container">
        <div class="manual-entry">
          <label for="pinCode">Code PIN de l'action</label>
          <input 
            type="text" 
            id="pinCode" 
            [(ngModel)]="pinCode" 
            placeholder="Ex: 123456" 
            maxlength="6"
            class="pin-input"
          />
          <button 
            class="btn btn--primary" 
            (click)="validerPresence()" 
            [disabled]="loading || pinCode.length < 4">
            {{ loading ? 'Validation en cours...' : 'Valider ma présence' }}
          </button>
        </div>

        <div *ngIf="message" class="result-message" [ngClass]="isError ? 'error' : 'success'">
          <div class="icon">{{ isError ? '✕' : '✓' }}</div>
          <p>{{ message }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scan-page {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #666;
      text-decoration: none;
    }
    .back-link:hover {
      color: #2D5A3D;
    }
    .page-title {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }
    .page-sub {
      color: #666;
      margin-bottom: 2rem;
    }
    .scan-container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .manual-entry {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .manual-entry label {
      font-weight: 500;
      color: #333;
    }
    .pin-input {
      padding: 1rem;
      font-size: 1.5rem;
      text-align: center;
      letter-spacing: 0.2em;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: border-color 0.2s;
    }
    .pin-input:focus {
      outline: none;
      border-color: #2D5A3D;
    }
    .btn {
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn--primary {
      background: #2D5A3D;
      color: white;
    }
    .result-message {
      margin-top: 2rem;
      padding: 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .result-message.success {
      background: #eef7f0;
      color: #2D5A3D;
    }
    .result-message.error {
      background: #fdf0ef;
      color: #c0392b;
    }
    .icon {
      font-size: 1.5rem;
      font-weight: bold;
    }
  `]
})
export class ScanParticipantComponent implements OnInit {
  pinCode = '';
  loading = false;
  message = '';
  isError = false;
  actionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private presenceService: PresenceService,
    private devContext: DevContextService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('actionId');
    if (id) {
      this.actionId = Number(id);
    }
  }

  validerPresence(): void {
    if (!this.pinCode || this.pinCode.trim().length < 4) return;
    
    this.loading = true;
    this.message = '';
    this.isError = false;

    const userId = this.devContext.getParticipantUserId();

    this.presenceService.validerParPin(this.pinCode.trim(), userId).subscribe({
      next: (res) => {
        this.loading = false;
        this.isError = false;
        this.message = 'Félicitations ! Votre présence a été validée. Vous avez gagné ' + res.pointsCredites + ' points Ecopria.';
        this.pinCode = '';
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        this.message = err.message;
      }
    });
  }
}
