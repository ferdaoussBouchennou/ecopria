import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PresenceService } from '../presence.service';
import { AuthService } from '../../../core/services/auth.service';
import { QrCode } from '../../../core/models/presence.model';
import { InscriptionService } from '../../inscription/inscription.service';
import { ActionDTO } from '../../inscription/models/inscription.model';

interface QrCodeWithAction {
  qr: QrCode;
  action: ActionDTO | null;
  loadingAction: boolean;
}

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css']
})
export class ValidationComponent implements OnInit {

  items: QrCodeWithAction[] = [];
  loading = true;
  erreurMessage = '';

  constructor(
    private presenceService: PresenceService,
    private inscriptionService: InscriptionService,
    private auth: AuthService
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreurMessage = '';

    this.presenceService.getMesQrCodes(this.userId).subscribe({
      next: (qrcodes: QrCode[]) => {
        // Trier : non-utilisés d'abord, puis par date d'expiration
        const sorted = qrcodes.sort((a, b) => {
          if (a.used !== b.used) return a.used ? 1 : -1;
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        });

        this.items = sorted.map(qr => ({ qr, action: null, loadingAction: true }));
        this.loading = false;

        // Charger les détails de chaque action en parallèle
        sorted.forEach((qr, idx) => {
          this.inscriptionService.getAction(qr.actionId).subscribe({
            next: (action: ActionDTO) => {
              this.items[idx] = { ...this.items[idx], action, loadingAction: false };
            },
            error: () => {
              this.items[idx] = { ...this.items[idx], loadingAction: false };
            }
          });
        });
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.loading = false;
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatExpiry(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  isExpired(iso: string): boolean {
    return new Date(iso) < new Date();
  }

  isExpiresoon(iso: string): boolean {
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // dans moins de 24h
  }

  get activeQrs(): QrCodeWithAction[] {
    return this.items.filter(i => !i.qr.used && !this.isExpired(i.qr.expiresAt));
  }

  get usedOrExpiredQrs(): QrCodeWithAction[] {
    return this.items.filter(i => i.qr.used || this.isExpired(i.qr.expiresAt));
  }
}
