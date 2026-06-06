import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { Profile } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { UiService } from '../../../core/services/ui.user.service';
import { RecompenseService } from '../../recompense/recompense.service';
import { CouponDto, CouponViewModel } from '../../../core/models/recompense.model';
import { downloadCouponPdf } from './coupon-pdf.util';

@Component({
  selector: 'app-recompenses',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './recompenses.component.html',
  styleUrl: '../styles/user-space.scss'
})
export class RecompensesComponent implements OnInit {
  readonly couponPageSize = 3;

  allCoupons: CouponViewModel[] = [];

  couponSearch = '';
  couponStatus: 'ALL' | 'DISTRIBUE' | 'UTILISE' | 'EXPIRE' = 'ALL';

  currentPageCoupons = 1;

  profile?: Profile;
  loading = true;
  downloadingCouponId?: number;
  emailingCouponId?: number;
  message = '';
  errorMessage = '';

  constructor(
    private readonly userService: UserService,
    private readonly recompenseService: RecompenseService,
    private readonly uiService: UiService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    this.uiService.setPageHeader('Mes récompenses', 'ESPACE GAGNANT');
    try {
      this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    forkJoin({
      profile: this.userService.getProfile(this.userId),
      coupons: this.recompenseService.getMesCoupons()
    }).subscribe({
      next: ({ profile, coupons }) => {
        this.profile = profile;
        this.allCoupons = coupons.map((c) => this.withExpiryFlag(c));
        this.currentPageCoupons = 1;
        this.loading = false;
      },
      error: () => {
        this.profile = undefined;
        this.allCoupons = [];
        this.errorMessage = 'Impossible de charger les récompenses pour le moment.';
        this.loading = false;
      }
    });
  }

  get coupons(): CouponViewModel[] {
    const start = (this.currentPageCoupons - 1) * this.couponPageSize;
    return this.filteredCoupons.slice(start, start + this.couponPageSize);
  }

  get totalPagesCoupons(): number {
    return Math.ceil(this.filteredCoupons.length / this.couponPageSize);
  }

  changePageCoupons(page: number): void {
    this.currentPageCoupons = page;
  }

  onCouponFiltersChanged(): void {
    this.currentPageCoupons = 1;
  }

  get filteredCoupons(): CouponViewModel[] {
    const q = this.couponSearch.trim().toLowerCase();
    return this.allCoupons.filter((c) => {
      const statusOk = this.couponStatus === 'ALL' ? true : c.status === this.couponStatus;
      if (!statusOk) return false;
      if (!q) return true;
      const haystack = `${c.recompenseTitle} ${c.partenaireName} ${c.code}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  get availablePoints(): number {
    return this.profile?.totalPoints ?? 0;
  }

  get expiringSoon(): number {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);
    return this.allCoupons.filter((coupon) => new Date(coupon.expireLe!) <= threshold).length;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'DISTRIBUE':
        return 'Disponible';
      case 'UTILISE':
        return 'Utilisé';
      case 'EXPIRE':
        return 'Expiré';
      default:
        return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'DISTRIBUE':
        return 'is-live';
      case 'UTILISE':
        return 'is-used';
      case 'EXPIRE':
        return 'is-expired';
      default:
        return '';
    }
  }

  expiryLabel(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  showQr(coupon: CouponViewModel): boolean {
    return coupon.status === 'DISTRIBUE' && !coupon.isExpired;
  }

  canUseCouponActions(coupon: CouponViewModel): boolean {
    return this.showQr(coupon);
  }

  isDownloading(coupon: CouponViewModel): boolean {
    return this.downloadingCouponId === coupon.id;
  }

  isEmailing(coupon: CouponViewModel): boolean {
    return this.emailingCouponId === coupon.id;
  }

  async downloadPdf(coupon: CouponViewModel): Promise<void> {
    if (!this.canUseCouponActions(coupon)) {
      return;
    }
    this.downloadingCouponId = coupon.id;
    this.errorMessage = '';
    try {
      await downloadCouponPdf(coupon);
      this.message = `PDF du coupon « ${coupon.recompenseTitle} » téléchargé.`;
    } catch {
      this.errorMessage = 'Impossible de générer le PDF pour ce coupon.';
    } finally {
      this.downloadingCouponId = undefined;
    }
  }

  sendEmail(coupon: CouponViewModel): void {
    if (!this.canUseCouponActions(coupon)) {
      return;
    }
    this.emailingCouponId = coupon.id;
    this.errorMessage = '';
    this.recompenseService.renvoyerCouponParEmail(coupon.id).subscribe({
      next: () => {
        this.message =
          `Le coupon « ${coupon.recompenseTitle} » a été renvoyé à votre adresse e-mail.`;
        this.emailingCouponId = undefined;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Impossible d’envoyer l’e-mail pour le moment.';
        this.emailingCouponId = undefined;
      }
    });
  }

  private withExpiryFlag(coupon: CouponDto): CouponViewModel {
    return {
      ...coupon,
      isExpired: new Date(coupon.expireLe!) < new Date()
    };
  }
}
