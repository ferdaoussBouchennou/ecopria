import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { AssociationUiService } from '../services/association-ui.service';
import { ActionService } from '../../action/services/action.service';
import { ActionDetail } from '../../action/models/action.model';
import { QRCodeModule } from 'angularx-qrcode';
import {
  downloadPresenceQrPdf,
  printPresenceQr,
} from '../utils/presence-qr-pdf.util';

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
    private actionService: ActionService,
    private ui: AssociationUiService
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

    void downloadPresenceQrPdf({
      qrToken: this.qrCodeDataUrl,
      pinCode: this.pinCode,
      actionTitle: this.action.title,
    }).catch((err) => {
      console.error('Erreur téléchargement QR PDF:', err);
      this.ui.toast('Impossible de générer le PDF du QR code.', 'error');
    });
  }

  imprimerQR(): void {
    if (!this.qrCodeDataUrl || !this.action) return;

    void printPresenceQr({
      qrToken: this.qrCodeDataUrl,
      pinCode: this.pinCode,
      actionTitle: this.action.title,
    }).catch((err) => {
      if (err instanceof Error && err.message === 'POPUP_BLOCKED') {
        this.ui.toast('Autorisez les fenêtres pop-up pour imprimer le QR code.', 'error');
        return;
      }
      console.error('Erreur impression QR:', err);
      this.ui.toast('Impossible d\'imprimer le QR code.', 'error');
    });
  }

  retour(): void {
    if (this.action?.id) {
      void this.router.navigate(['/association/action', this.action.id]);
    } else {
      void this.router.navigate(['/association/mes-actions']);
    }
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
