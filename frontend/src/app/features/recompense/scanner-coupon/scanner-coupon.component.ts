import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { PartenaireService } from '../partenaire.service';
import { CouponDto } from '../../../core/models/recompense.model';

type ScannerMode = 'camera' | 'manual';

@Component({
  selector: 'app-scanner-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './scanner-coupon.component.html',
  styleUrls: ['./scanner-coupon.component.scss']
})
export class ScannerCouponComponent implements OnDestroy {
  readonly allowedFormats = [BarcodeFormat.QR_CODE];

  code = '';
  loading = false;
  erreur = '';
  coupon: CouponDto | null = null;
  history: CouponDto[] = [];

  scannerMode: ScannerMode = 'camera';
  scannerEnabled = true;
  cameraError = '';

  private lastScanMs = 0;

  constructor(private partenaireService: PartenaireService) {}

  ngOnDestroy(): void {
    this.scannerEnabled = false;
  }

  setMode(mode: ScannerMode): void {
    this.scannerMode = mode;
    this.erreur = '';
    this.cameraError = '';
    this.scannerEnabled = mode === 'camera';
  }

  onScanSuccess(raw: string): void {
    const decoded = raw?.trim().toUpperCase();
    if (!decoded) return;

    const now = Date.now();
    if (this.loading || now - this.lastScanMs < 2500) return;

    this.lastScanMs = now;
    this.code = decoded;
    this.valider();
  }

  onScanError(error: unknown): void {
    if (error && typeof error === 'object' && 'name' in error) {
      const name = String((error as { name: string }).name);
      if (name === 'NotAllowedError') {
        this.cameraError =
          'Accès à la caméra refusé. Autorisez la caméra ou utilisez la saisie manuelle.';
        this.setMode('manual');
        return;
      }
    }
    this.cameraError = 'Impossible d\'activer la caméra sur cet appareil.';
  }

  valider(): void {
    const trimmed = this.code.trim().toUpperCase();
    if (!trimmed || this.loading) return;

    this.loading = true;
    this.erreur = '';
    this.coupon = null;
    this.scannerEnabled = false;

    this.partenaireService.validerCoupon(trimmed).subscribe({
      next: (c) => {
        this.coupon = c;
        this.history.unshift(c);
        this.code = '';
        this.loading = false;
        setTimeout(() => {
          if (this.scannerMode === 'camera') {
            this.scannerEnabled = true;
          }
        }, 2500);
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
        setTimeout(() => {
          if (this.scannerMode === 'camera') {
            this.scannerEnabled = true;
          }
        }, 2000);
      }
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
