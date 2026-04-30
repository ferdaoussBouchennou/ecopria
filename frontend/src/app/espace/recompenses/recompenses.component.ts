import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, from, map, switchMap, tap } from 'rxjs';
import { Profile } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { UiService } from '../../core/services/ui.user.service';
import { RecompenseService } from '../../core/services/recompense.service';
import { CouponDto, CouponViewModel, RecompenseItemDto } from '../../core/models/recompense.model';
import * as QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-recompenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recompenses.component.html',
  styleUrl: './recompenses.component.scss'
})
export class RecompensesComponent implements OnInit {
  readonly userId = 1;
  readonly pageSize = 4;

  allCatalogue: RecompenseItemDto[] = [];
  allCoupons: CouponViewModel[] = [];

  couponSearch = '';
  couponStatus: 'ALL' | 'DISTRIBUE' | 'UTILISE' | 'EXPIRE' = 'ALL';

  catalogueSearch = '';
  catalogueType: 'ALL' | RecompenseItemDto['type'] = 'ALL';
  
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
    private readonly uiService: UiService
  ) {}

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
      coupons: this.recompenseService.getMesCoupons(this.userId)
    }).pipe(
      switchMap(({ profile, catalogue, coupons }) => {
        const couponPromises = coupons.map(async (coupon) => {
          const vm = this.withExpiryFlag(coupon);
          try {
            // Generate QR code containing the coupon code
            vm.qrCodeUrl = await QRCode.toDataURL(coupon.code, {
              margin: 1,
              color: {
                dark: '#36594d',
                light: '#ffffff'
              }
            });
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
    return this.allCoupons.filter((coupon) => new Date(coupon.expireLe) <= threshold).length;
  }

  exchange(recompense: RecompenseItemDto): void {
    if (!recompense.isAvailable || this.availablePoints < recompense.pointsNecessaires) {
      return;
    }

    this.exchangingId = recompense.id;
    this.recompenseService.echanger(this.userId, recompense.id).pipe(
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
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [100, 150]
      });

      // Style de fond
      doc.setFillColor(240, 247, 244);
      doc.rect(0, 0, 100, 150, 'F');

      // En-tête
      doc.setTextColor(54, 89, 77);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ECOPRIA', 50, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('VOTRE RÉCOMPENSE', 50, 22, { align: 'center' });

      // Partenaire & Titre
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(coupon.partenaireName, 50, 35, { align: 'center' });
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(coupon.recompenseTitle, 50, 42, { align: 'center' });

      // Boîte du Code
      doc.setDrawColor(54, 89, 77);
      doc.setLineWidth(0.5);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 50, 70, 25, 4, 4, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('CODE DE RÉDUCTION', 50, 58, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('courier', 'bold');
      doc.text(coupon.code, 50, 68, { align: 'center' });

      // QR Code
      if (coupon.qrCodeUrl) {
        doc.addImage(coupon.qrCodeUrl, 'PNG', 30, 85, 40, 40);
      }

      // Pied de page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(`Expire le : ${this.expiryLabel(coupon.expireLe)}`, 50, 135, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Merci pour votre engagement écologique !', 50, 142, { align: 'center' });

      // Téléchargement
      doc.save(`Coupon_Ecopria_${coupon.code}.pdf`);
      this.message = `Votre coupon PDF pour "${coupon.recompenseTitle}" a été téléchargé.`;
    } catch (err) {
      console.error('Erreur PDF:', err);
      this.errorMessage = 'Impossible de générer le PDF pour le moment.';
    }
  }

  sendEmail(coupon: CouponViewModel): void {
    this.message = `Envoi du coupon "${coupon.recompenseTitle}" par email...`;
    setTimeout(() => this.message = `Le coupon "${coupon.recompenseTitle}" a été envoyé à votre adresse email.`, 1500);
  }

  private withExpiryFlag(coupon: CouponDto): CouponViewModel {
    return {
      ...coupon,
      isExpired: new Date(coupon.expireLe) < new Date()
    };
  }
}