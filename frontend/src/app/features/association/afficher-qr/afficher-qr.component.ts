import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { ActionService } from '../../action/services/action.service';
import { ActionDetail } from '../../action/models/action.model';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-afficher-qr',
  standalone: true,
  imports: [CommonModule, RouterLink, QRCodeModule],
  templateUrl: './afficher-qr.component.html',
  styleUrls: ['./afficher-qr.component.css']
})
export class AfficherQRComponent implements OnInit {
  action: ActionDetail | null = null;
  pinCode: string | null = null;
  qrCodeDataUrl: string | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private associationService: AssociationService,
    private actionService: ActionService
  ) {}

  ngOnInit(): void {
    const actionId = this.route.snapshot.paramMap.get('id');
    if (actionId) {
      this.loadActionAndQR(Number(actionId));
    } else {
      this.error = "ID d'action invalide";
      this.loading = false;
    }
  }

  loadActionAndQR(actionId: number): void {
    this.loading = true;
    this.error = null;

    // Charger les détails de l'action
    this.actionService.getActionById(actionId).subscribe({
      next: (action) => {
        this.action = action;

          // Si aucune inscription, afficher un message d'attente
          if (action.registeredCount === 0) {
            this.loading = false;
            // Aucun QR à charger tant qu'il n'y a pas d'inscription
            this.qrCodeDataUrl = null;
            this.pinCode = null;
            // On affichera un texte d'information dans le template
            return;
          }

        // Charger le QR code
        this.associationService.getQRCode(actionId).subscribe({
          next: (response) => {
            this.pinCode = response.pinCode;
            this.qrCodeDataUrl = response.qrCode; // Store raw token for local generation
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur chargement QR:', err);
            this.error = 'Erreur lors du chargement du QR code';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement action:', err);
        this.error = "Cette action n'existe pas ou vous n'y avez pas accès.";
        this.loading = false;
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
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
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
          <div class="qr-container">
             <!-- Pour l'impression on peut utiliser une librairie JS ou afficher juste le token, mais on va simplement afficher le pin -->
             <h2>Code PIN : ${this.pinCode}</h2>
          </div>
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

  retour(): void {
    this.router.navigate(['/mes-actions']);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
