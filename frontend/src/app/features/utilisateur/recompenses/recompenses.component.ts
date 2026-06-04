import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { forkJoin, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Profile } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { UiService } from '../../../core/services/ui.user.service';
import { RecompenseService } from '../../recompense/recompense.service';
import {
  RecompenseItemDto,
  CouponDto,
  CouponViewModel,
  RecompenseType
} from '../../../core/models/recompense.model';
import { downloadCouponPdf } from './coupon-pdf.util';

@Component({
  selector: 'app-recompenses',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './recompenses.component.html',
  styleUrl: '../styles/user-space.scss'
})
export class RecompensesComponent implements OnInit {
  readonly pageSize = 4;

  allCatalogue: RecompenseItemDto[] = [];
  allCoupons: CouponViewModel[] = [];

  couponSearch = '';
  couponStatus: 'ALL' | 'DISTRIBUE' | 'UTILISE' | 'EXPIRE' = 'ALL';

  catalogueSearch = '';
  catalogueType: 'ALL' | RecompenseType = 'ALL';

  currentPageCatalogue = 1;
  currentPageCoupons = 1;

  profile?: Profile;
  loading = true;
  exchangingId?: number;
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
      catalogue: this.recompenseService.getCatalogue(),
      coupons: this.recompenseService.getMesCoupons()
    }).subscribe({
      next: ({ profile, catalogue, coupons }) => {
        this.profile = profile;
        this.allCatalogue = catalogue;
        this.allCoupons = coupons.map((c) => this.withExpiryFlag(c));
        this.currentPageCatalogue = 1;
        this.currentPageCoupons = 1;
        this.loading = false;
      },
      error: () => {
        this.profile = undefined;
        this.allCatalogue = [];
        this.allCoupons = [];
        this.errorMessage = 'Impossible de charger les récompenses pour le moment.';
        this.loading = false;
      }
    });
  }

  get catalogue(): RecompenseItemDto[] {
    const start = (this.currentPageCatalogue - 1) * this.pageSize;
    return this.filteredCatalogue.slice(start, start + this.pageSize);
  }

  get coupons(): CouponViewModel[] {
    const start = (this.currentPageCoupons - 1) * this.pageSize;
    return this.filteredCoupons.slice(start, start + this.pageSize);
  }

  get totalPagesCatalogue(): number {
    return Math.ceil(this.filteredCatalogue.length / this.pageSize);
  }

  get totalPagesCoupons(): number {
    return Math.ceil(this.filteredCoupons.length / this.pageSize);
  }

  changePageCatalogue(page: number): void {
    this.currentPageCatalogue = page;
  }

  onCatalogueFiltersChanged(): void {
    this.currentPageCatalogue = 1;
  }

  get filteredCatalogue(): RecompenseItemDto[] {
    const q = this.catalogueSearch.trim().toLowerCase();
    return this.allCatalogue.filter((r) => {
      const typeOk = this.catalogueType === 'ALL' ? true : r.type === this.catalogueType;
      if (!typeOk) return false;
      if (!q) return true;
      const haystack = `${r.title} ${r.description} ${r.partenaireName} ${r.partenaireCategory}`.toLowerCase();
      return haystack.includes(q);
    });
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

  exchange(recompense: RecompenseItemDto): void {
    if (!recompense.isAvailable || this.availablePoints < recompense.pointsNecessaires) {
      return;
    }

    this.exchangingId = recompense.id;
    this.recompenseService.echanger(recompense.id).pipe(
      tap(() => this.message = `Récompense "${recompense.title}" échangée avec succès.`),
    ).subscribe(() => {
      this.exchangingId = undefined;
      this.reload();
    }, (err: Error) => {
      this.exchangingId = undefined;
      this.errorMessage = err.message || 'L’échange n’a pas pu être effectué pour le moment.';
    });
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
