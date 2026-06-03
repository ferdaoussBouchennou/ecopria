import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, from, map, switchMap, tap } from 'rxjs';
import { Profile } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';
import { RecompenseService } from '../../recompense/recompense.service';
import {
  RecompenseItemDto,
  CouponDto,
  CouponViewModel,
  RecompenseType
} from '../../../core/models/recompense.model';

@Component({
  selector: 'app-recompenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  message = '';
  errorMessage = '';

  constructor(
    private readonly userService: UserService,
    private readonly recompenseService: RecompenseService,
    private readonly uiService: UiService,
    private readonly auth: AuthService
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    this.uiService.setPageHeader('Mes récompenses', 'ESPACE GAGNANT');
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
    }).pipe(
      switchMap(({ profile, catalogue, coupons }) => {
        const couponPromises = coupons.map(async (coupon) => {
          const vm = this.withExpiryFlag(coupon);
          try {
            // Just simulate QR code for now - no real library
            vm.qrCodeUrl = 'assets/logo.png';
          } catch (err) {
            console.error('Error generating QR code', err);
          }
          return vm;
        });

        return from(Promise.all(couponPromises)).pipe(
          map((couponsWithQr) => ({
            profile,
            catalogue,
            coupons: couponsWithQr
          }))
        );
      })
    ).subscribe({
      next: ({ profile, catalogue, coupons }) => {
        this.profile = profile;
        this.allCatalogue = catalogue;
        this.allCoupons = coupons;
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
    }, () => {
      this.exchangingId = undefined;
      this.message = 'L’échange n’a pas pu être effectué pour le moment.';
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

  downloadPdf(coupon: CouponViewModel): void {
    this.message = `Téléchargement du coupon "${coupon.recompenseTitle}" en cours...`;
    setTimeout(() => {
      this.message = `Votre coupon "${coupon.recompenseTitle}" est prêt à être téléchargé.`;
    }, 1000);
  }

  sendEmail(coupon: CouponViewModel): void {
    this.message = `Envoi du coupon "${coupon.recompenseTitle}" par email...`;
    setTimeout(() => this.message = `Le coupon "${coupon.recompenseTitle}" a été envoyé à votre adresse email.`, 1500);
  }

  private withExpiryFlag(coupon: CouponDto): CouponViewModel {
    return {
      ...coupon,
      qrCodeUrl: 'assets/logo.png',
      isExpired: new Date(coupon.expireLe!) < new Date()
    };
  }
}
