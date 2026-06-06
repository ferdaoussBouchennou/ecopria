import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActionService } from '../../action/services/action.service';
import { AssociationService } from '../services/association.service';
import { AssociationUiService } from '../services/association-ui.service';
import { ActionDetail } from '../../action/models/action.model';
import {
  formatActionDate,
  formatTimeRange,
  formatInscritsLabel,
  formatLieu,
} from '../../action/utils/action-format.utils';

import { QRCodeModule } from 'angularx-qrcode';
import {
  downloadPresenceQrPdf,
  printPresenceQr,
} from '../utils/presence-qr-pdf.util';

@Component({
  selector: 'app-detail-action-asso',
  standalone: true,
  imports: [CommonModule, RouterLink, QRCodeModule],
  templateUrl: './detail-action-asso.component.html',
  styleUrls: ['./detail-action-asso.component.css']
})
export class DetailActionAssoComponent implements OnInit {
  action: ActionDetail | null = null;
  loading = true;
  error: string | null = null;
  
  qrCodeDataUrl: string | null = null;
  pinCode: string | null = null;
  loadingQR = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actionService: ActionService,
    private associationService: AssociationService,
    private ui: AssociationUiService
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
        this.pinCode = response.pinCode;
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

  modifierAction(): void {
    if (this.action && this.canModifyAction()) {
      this.router.navigate(['/association/modifier', this.action.id]);
    }
  }

  annulerAction(): void {
    if (!this.action || !this.canCancelAction()) return;

    this.ui.prompt({
      title: 'Annuler l\'action',
      message: 'Motif obligatoire — un e-mail sera envoyé à tous les inscrits.',
      placeholder: 'Motif d\'annulation…',
      required: true
    }).subscribe((raison) => {
      if (raison === null) return;
      const trimmed = raison.trim();
      this.ui.confirm({
        title: 'Confirmer l\'annulation',
        message: 'Tous les inscrits seront notifiés par e-mail.',
        confirmLabel: 'Annuler l\'action',
        danger: true
      }).subscribe((ok) => {
        if (!ok) return;
        this.associationService.annulerAction(this.action!.id, trimmed).subscribe({
          next: () => {
            this.ui.toast('Action annulée. Les participants ont été notifiés.', 'success');
            this.router.navigate(['/association/mes-actions']);
          },
          error: (err) => {
            const msg = err?.error?.message || 'Erreur lors de l\'annulation';
            this.ui.toast(msg, 'error');
            console.error(err);
          }
        });
      });
    });
  }

  retour(): void {
    this.router.navigate(['/association/mes-actions']);
  }

  voirParticipants(): void {
    if (this.action) {
      this.router.navigate(['/association/action', this.action.id, 'participants']);
    }
  }

  ouvrirQrPleinEcran(): void {
    if (this.action) {
      void this.router.navigate(['/association/action', this.action.id, 'qr']);
    }
  }

  validerPresences(): void {
    if (this.action) {
      void this.router.navigate(['/association/action', this.action.id, 'valider-presence']);
    }
  }

  getRegistrationPercent(): number {
    if (!this.action?.maxParticipants) return 0;
    return Math.min(
      100,
      Math.round((this.action.registeredCount / this.action.maxParticipants) * 100)
    );
  }

  getRemainingPlaces(): number {
    if (!this.action) {
      return 0;
    }
    if (typeof this.action.availablePlaces === 'number') {
      return Math.max(0, this.action.availablePlaces);
    }
    return Math.max(0, this.action.maxParticipants - this.action.registeredCount);
  }

  getStatusLabel(): string {
    if (!this.action) {
      return '';
    }

    if (this.action.status === 'CANCELLED') {
      return 'Annulée';
    }
    if (this.action.status === 'DRAFT') {
      return 'Brouillon';
    }
    if (this.isPastAction()) {
      return 'Terminée';
    }
    if (this.getRegistrationPercent() >= 100) {
      return 'Complet';
    }
    return 'Publiée';
  }

  getStatusClass(): string {
    if (!this.action) {
      return '';
    }

    if (this.action.status === 'CANCELLED') {
      return 'status-cancelled';
    }
    if (this.action.status === 'DRAFT') {
      return 'status-draft';
    }
    if (this.isPastAction()) {
      return 'status-completed';
    }
    if (this.getRegistrationPercent() >= 80) {
      return 'status-warning';
    }
    return 'status-published';
  }

  getHeroImage(): string {
    if (this.action?.photoUrls?.length) {
      return this.action.photoUrls[0];
    }
    return this.action?.associationLogoUrl || '/assets/placeholder-action.jpg';
  }

  getGalleryImages(): string[] {
    return this.action?.photoUrls?.slice(1) ?? [];
  }

  getScheduleLabel(): string {
    if (!this.action) {
      return '';
    }
    return `${this.formatDate(this.action.dateStart)} · ${this.formatTime(this.action.dateStart, this.action.dateEnd)}`;
  }

  getMapsUrl(): string | null {
    if (!this.action) {
      return null;
    }

    if (this.action.latitude != null && this.action.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${this.action.latitude},${this.action.longitude}`;
    }

    const query = encodeURIComponent(`${this.action.address}, ${this.action.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  hasCoordinates(): boolean {
    return !!(this.action && this.action.latitude != null && this.action.longitude != null);
  }

  getParticipationLabel(): string {
    if (!this.action) {
      return '';
    }
    return `${this.action.registeredCount} / ${this.action.maxParticipants} inscrits`;
  }

  canModifyAction(): boolean {
    return !!this.action && (this.action.status === 'DRAFT' || (this.action.status === 'PUBLISHED' && !this.isPastAction()));
  }

  canCancelAction(): boolean {
    return !!this.action && this.action.status === 'PUBLISHED' && !this.isPastAction();
  }

  isPastAction(): boolean {
    return !!this.action && new Date(this.action.dateEnd).getTime() < Date.now();
  }

  formatDate = formatActionDate;
  formatTime = formatTimeRange;
  formatLieu = formatLieu;
  formatInscrits = formatInscritsLabel;
}
