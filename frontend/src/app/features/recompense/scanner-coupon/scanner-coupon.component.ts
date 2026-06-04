import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../partenaire.service';
import { CouponDto } from '../../../core/models/recompense.model';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-scanner-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scanner-coupon.component.html',
  styleUrls: ['./scanner-coupon.component.scss']
})
export class ScannerCouponComponent implements OnInit, OnDestroy {
  code = '';
  loading = false;
  erreur = '';
  coupon: CouponDto | null = null;
  history: CouponDto[] = [];

  // Scanner QR
  scannerMode: 'manual' | 'camera' = 'manual';
  html5QrCode: Html5Qrcode | null = null;
  isScannerActive = false;
  scannerError = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    // Initialiser le scanner (sans le démarrer)
    this.html5QrCode = new Html5Qrcode('qr-reader');
  }

  ngOnDestroy(): void {
    // Arrêter le scanner si actif
    this.stopScanner();
  }

  toggleScannerMode(): void {
    if (this.scannerMode === 'manual') {
      this.scannerMode = 'camera';
      this.startScanner();
    } else {
      this.scannerMode = 'manual';
      this.stopScanner();
    }
  }

  async startScanner(): Promise<void> {
    if (!this.html5QrCode) return;

    try {
      this.scannerError = '';
      this.isScannerActive = true;

      await this.html5QrCode.start(
        { facingMode: 'environment' }, // Caméra arrière
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          console.log('QR Code scanné:', decodedText);
          this.code = decodedText;
          this.stopScanner();
          this.scannerMode = 'manual';
          this.valider();
        },
        (_errorMessage: string) => {
          // Erreurs de scan (ignorées, très fréquentes)
        }
      );
    } catch (error: any) {
      console.error('Erreur démarrage scanner:', error);
      this.scannerError = 'Impossible d\'accéder à la caméra. Vérifiez les permissions.';
      this.isScannerActive = false;
      this.scannerMode = 'manual';
    }
  }

  stopScanner(): void {
    if (this.html5QrCode && this.isScannerActive) {
      this.html5QrCode.stop()
        .then(() => {
          this.isScannerActive = false;
        })
        .catch((error: unknown) => {
          console.error('Erreur arrêt scanner:', error);
          this.isScannerActive = false;
        });
    }
  }

  valider(): void {
    const trimmed = this.code.trim().toUpperCase();
    if (!trimmed) return;

    this.loading = true;
    this.erreur = '';
    this.coupon = null;

    this.partenaireService.validerCoupon(trimmed).subscribe({
      next: (c) => {
        this.coupon = c;
        this.history.unshift(c);
        this.code = '';
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
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
