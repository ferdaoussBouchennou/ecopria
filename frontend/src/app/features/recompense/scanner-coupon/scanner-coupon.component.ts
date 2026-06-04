import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../partenaire.service';
import { CouponDto } from '../../../core/models/recompense.model';

declare const Html5Qrcode: any;

@Component({
  selector: 'app-scanner-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scanner-coupon.component.html',
  styleUrls: ['./scanner-coupon.component.scss']
})
export class ScannerCouponComponent implements OnDestroy {
  code    = '';
  loading = false;
  erreur  = '';
  coupon: CouponDto | null = null;
  history: CouponDto[] = [];

  // Mode : 'manual' | 'upload' (caméra retirée)
  scannerMode: 'manual' | 'upload' = 'upload';
  isScannerActive = false;
  scannerError    = '';

  // Mode upload
  uploadProcessing = false;
  uploadError      = '';
  uploadPreview: string | null = null;
  dragOver         = false;

  private html5QrCode: any = null;

  constructor(private partenaireService: PartenaireService) {}

  ngOnDestroy(): void {
    // Cleanup si nécessaire
  }

  // ── Mode upload document/image ────────────────────────────────
  switchToUpload(): void {
    this.scannerMode = 'upload';
    this.uploadError = '';
    this.uploadPreview = null;
    this.erreur = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Format non supporté. Veuillez sélectionner une image (PNG, JPG, WebP…)';
      return;
    }

    this.uploadError = '';
    this.uploadProcessing = true;
    this.uploadPreview = null;

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => { this.uploadPreview = e.target?.result as string; };
    reader.readAsDataURL(file);

    // Lecture QR via html5-qrcode
    console.log('Html5Qrcode disponible ?', typeof Html5Qrcode !== 'undefined');
    
    if (typeof Html5Qrcode !== 'undefined') {
      try {
        const scanner = new Html5Qrcode('qr-upload-hidden');
        scanner.scanFile(file, false)
          .then((decoded: string) => {
            console.log('QR code détecté:', decoded);
            this.code = decoded.trim().toUpperCase();
            this.uploadProcessing = false;
            // Ne pas valider automatiquement, laisser l'utilisateur voir le code
            // this.valider();
          })
          .catch((err: any) => {
            console.error('Erreur détection QR:', err);
            this.uploadError = 'Aucun QR code détecté. Vérifiez que l\'image est nette, ou saisissez le code manuellement.';
            this.uploadProcessing = false;
          });
      } catch (e) {
        console.error('Erreur création scanner:', e);
        this.uploadError = 'Erreur lors de l\'initialisation du scanner. Essayez de recharger la page.';
        this.uploadProcessing = false;
      }
    } else {
      console.warn('Html5Qrcode non disponible, essai avec BarcodeDetector');
      this.readQrViaCanvas(file);
    }
  }

  /** Fallback sans html5-qrcode : lecture via Canvas */
  private readQrViaCanvas(file: File): void {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      // Essaie d'extraire le texte via BarcodeDetector (API native Chromium)
      if ('BarcodeDetector' in window) {
        console.log('Utilisation de BarcodeDetector');
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        detector.detect(canvas)
          .then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              console.log('QR détecté via BarcodeDetector:', barcodes[0].rawValue);
              this.code = barcodes[0].rawValue.trim().toUpperCase();
              this.uploadProcessing = false;
              // Ne pas valider automatiquement
              // this.valider();
            } else {
              this.uploadError = 'Aucun QR code trouvé dans cette image.';
              this.uploadProcessing = false;
            }
          })
          .catch((err: any) => {
            console.error('Erreur BarcodeDetector:', err);
            this.uploadError = 'Impossible de lire le QR. Saisissez le code manuellement.';
            this.uploadProcessing = false;
          });
      } else {
        console.error('Aucune méthode de lecture QR disponible');
        this.uploadError = 'Lecture QR non supportée dans ce navigateur. Veuillez recharger la page ou saisir le code manuellement.';
        this.uploadProcessing = false;
      }
    };
    img.onerror = () => {
      this.uploadError = 'Impossible de charger l\'image.';
      this.uploadProcessing = false;
    };
    img.src = URL.createObjectURL(file);
  }

  // ── Validation coupon ─────────────────────────────────────────
  valider(): void {
    const trimmed = this.code.trim().toUpperCase();
    if (!trimmed) return;

    this.loading = true;
    this.erreur  = '';
    this.coupon  = null;

    this.partenaireService.validerCoupon(trimmed).subscribe({
      next: (c) => {
        this.coupon  = c;
        this.history.unshift(c);
        this.code    = '';
        this.loading = false;
        this.uploadPreview   = null;
        this.uploadError     = '';
      },
      error: (e: Error) => {
        this.erreur  = e.message;
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
