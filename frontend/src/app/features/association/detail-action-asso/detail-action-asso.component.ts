import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActionService } from '../../action/services/action.service';
import { AssociationService } from '../services/association.service';
import { ActionDetail } from '../../action/models/action.model';
import {
  formatActionDate,
  formatTimeRange,
  formatInscritsLabel,
  formatLieu,
} from '../../action/utils/action-format.utils';

@Component({
  selector: 'app-detail-action-asso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-action-asso.component.html',
  styleUrls: ['./detail-action-asso.component.css']
})
export class DetailActionAssoComponent implements OnInit {
  action: ActionDetail | null = null;
  loading = true;
  error: string | null = null;
  
  qrCodeDataUrl: string | null = null;
  loadingQR = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actionService: ActionService,
    private associationService: AssociationService
  ) {}

  ngOnInit(): void {
    const actionId = this.route.snapshot.paramMap.get('id');
    if (actionId) {
      this.loadAction(Number(actionId));
    } else {
      this.error = "ID d'action invalide";
      this.loading = false;
    }
  }

  loadAction(id: number): void {
    this.loading = true;
    this.error = null;

    this.actionService.getActionById(id).subscribe({
      next: (data) => {
        this.action = data;
        this.loading = false;
        
        // Charger le QR code si il y a des inscrits
        if (data.registeredCount > 0) {
          this.loadQRCode(id);
        }
      },
      error: () => {
        this.error = "Cette action n'existe pas ou n'est plus disponible.";
        this.loading = false;
      },
    });
  }

  loadQRCode(actionId: number): void {
    this.loadingQR = true;
    this.associationService.getQRCode(actionId).subscribe({
      next: (response) => {
        this.qrCodeDataUrl = response.qrCode;
        this.loadingQR = false;
      },
      error: (err) => {
        console.error('Erreur chargement QR:', err);
        this.loadingQR = false;
      }
    });
  }

  telechargerQR(): void {
    if (!this.qrCodeDataUrl || !this.action) return;

    const link = document.createElement('a');
    link.href = this.qrCodeDataUrl;
    link.download = `qr-code-${this.action.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  imprimerQR(): void {
    if (!this.qrCodeDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les pop-ups pour imprimer le QR code');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${this.action?.title || 'Action'}</title>
          <style>
            body {
              margin: 0;
              padding: 2rem;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            h1 {
              font-size: 1.5rem;
              margin-bottom: 0.5rem;
              text-align: center;
            }
            p {
              color: #666;
              margin-bottom: 2rem;
              text-align: center;
            }
            img {
              max-width: 400px;
              width: 100%;
              height: auto;
            }
            .footer {
              margin-top: 2rem;
              font-size: 0.875rem;
              color: #999;
            }
            @media print {
              body {
                padding: 1rem;
              }
            }
          </style>
        </head>
        <body>
          <h1>${this.action?.title || 'Action'}</h1>
          <p>Scannez ce QR code pour valider votre présence</p>
          <img src="${this.qrCodeDataUrl}" alt="QR Code" />
          <div class="footer">
            <p>Ecopria - ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  modifierAction(): void {
    if (this.action) {
      this.router.navigate(['/association/modifier', this.action.id]);
    }
  }

  annulerAction(): void {
    if (!this.action) return;
    
    const raison = prompt('Raison de l\'annulation (optionnel) :');
    if (raison !== null) {
      this.associationService.annulerAction(this.action.id, raison).subscribe({
        next: () => {
          alert('Action annulée avec succès');
          this.router.navigate(['/association/mes-actions']);
        },
        error: (err) => {
          alert('Erreur lors de l\'annulation');
          console.error(err);
        }
      });
    }
  }

  retour(): void {
    this.router.navigate(['/association/mes-actions']);
  }

  getRegistrationPercent(): number {
    if (!this.action?.maxParticipants) return 0;
    return Math.min(
      100,
      Math.round((this.action.registeredCount / this.action.maxParticipants) * 100)
    );
  }

  formatDate = formatActionDate;
  formatTime = formatTimeRange;
  formatLieu = formatLieu;
  formatInscrits = formatInscritsLabel;
}
