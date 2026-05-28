import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActionService } from '../services/action.service';
import { AssociationService } from '../../association/services/association.service';
import { ActionDetail } from '../models/action.model';
import { getCategoryMeta } from '../constants/category-meta';
import {
  formatActionDate,
  formatTimeRange,
  formatInscritsLabel,
  formatLieu,
  formatPlacesLabel,
  isActionFull,
} from '../utils/action-format.utils';

@Component({
  selector: 'app-detail-action',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-action.component.html',
  styleUrls: ['./detail-action.component.css'],
})
export class DetailActionComponent implements OnInit {
  action: ActionDetail | null = null;
  loading = true;
  error: string | null = null;
  
  // QR Code pour les associations
  qrCodeDataUrl: string | null = null;
  loadingQR = false;
  isAssociationView = false; // TODO: Remplacer par vérification auth réelle

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
        
        // TODO: Vérifier si l'utilisateur connecté est l'association propriétaire
        // Pour l'instant, on simule avec true pour le développement
        this.isAssociationView = true;
        
        // Charger le QR code si c'est l'association et qu'il y a des inscrits
        if (this.isAssociationView && data.registeredCount > 0) {
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

  getCategoryColor(): string {
    return this.action
      ? getCategoryMeta(this.action.categoryName).color
      : '#2D6A4F';
  }

  getHeroImage(): string {
    if (!this.action) return '';
    return (
      this.action.photoUrls?.[0] ||
      this.action.categoryImageUrl ||
      `/assets/categories/${getCategoryMeta(this.action.categoryName).slug}.svg`
    );
  }

  isFull(): boolean {
    return this.action ? isActionFull(this.action) : false;
  }

  participate(): void {
    if (!this.action || this.isFull()) {
      return;
    }
    
    // TODO: Récupérer l'ID utilisateur depuis le service d'authentification
    const userId = 1; // Temporaire pour le développement
    
    this.router.navigate(['/inscription', this.action.id], {
      queryParams: { userId }
    });
  }

  share(): void {
    if (!this.action) return;

    const shareData = {
      title: `${this.action.title} - Ecopria`,
      text: `Rejoignez-moi pour cette action : ${this.action.title}`,
      url: window.location.href
    };

    // Vérifier si l'API Web Share est disponible (mobile principalement)
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Partage réussi'))
        .catch((error) => {
          // Si l'utilisateur annule, ne rien faire
          if (error.name !== 'AbortError') {
            console.error('Erreur lors du partage:', error);
            this.fallbackShare();
          }
        });
    } else {
      // Fallback : copier le lien dans le presse-papiers
      this.fallbackShare();
    }
  }

  private fallbackShare(): void {
    const url = window.location.href;
    
    // Essayer de copier dans le presse-papiers
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('Lien copié dans le presse-papiers !');
        })
        .catch(() => {
          // Si la copie échoue, afficher le lien
          this.showShareDialog(url);
        });
    } else {
      // Méthode alternative pour les navigateurs plus anciens
      this.showShareDialog(url);
    }
  }

  private showShareDialog(url: string): void {
    const message = `Partagez cette action :\n\n${url}`;
    prompt('Copiez ce lien pour partager :', url);
  }

  goBack(): void {
    this.router.navigate(['/actions']);
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
  formatPlacesLabel = formatPlacesLabel;
  formatInscrits = formatInscritsLabel;
}
