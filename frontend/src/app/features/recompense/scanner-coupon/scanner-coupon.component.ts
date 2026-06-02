import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../partenaire.service';
import { CouponDto } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-scanner-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scanner-coupon.component.html',
  styleUrls: ['./scanner-coupon.component.scss']
})
export class ScannerCouponComponent {
  code    = '';
  loading = false;
  erreur  = '';
  coupon: CouponDto | null = null;
  history: CouponDto[] = [];

  constructor(private partenaireService: PartenaireService) {}

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
