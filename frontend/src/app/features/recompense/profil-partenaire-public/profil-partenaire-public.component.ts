import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { RecompenseService } from '../recompense.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { QrCodeService } from '../../../core/services/qrcode.service';
import { PartenaireProfil, RecompenseItemDto, CouponDto } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-profil-partenaire-public',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profil-partenaire-public.component.html',
  styleUrls: ['./profil-partenaire-public.component.scss']
})
export class ProfilPartenairePublicComponent implements OnInit {
  profil: PartenaireProfil | null = null;
  offres: RecompenseItemDto[] = [];
  loading = true;
  loadingOffres = true;
  erreur = '';
  erreurOffres = '';

  echangeEnCours: number | null = null;
  showSuccessModal = false;
  couponGenere: CouponDto | null = null;

  /** Solde du participant connecté (rôle USER uniquement). */
  soldePoints = 0;
  loadingSolde = false;

  qrCodeDataUrl = '';
  qrCodeLoading = false;

  private readonly fallbackImage = '/assets/images/event-affiche-2.jpg';

  /** Exposé au template pour distinguer visiteur / autre rôle. */
  readonly auth = inject(AuthService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private partenaireService: PartenaireService,
    private recompenseService: RecompenseService,
    private userService: UserService,
    private qrCodeService: QrCodeService
  ) {}

  /** Seuls les participants (citoyens) possèdent et dépensent des points. */
  get isLoggedInCitizen(): boolean {
    return this.auth.isLoggedIn() && this.auth.getRole() === 'USER';
  }

  get loginReturnUrl(): string {
    return this.router.url;
  }

  get partnerInitial(): string {
    const name = this.profil?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : 'P';
  }


  get hasSocialLinks(): boolean {
    const p = this.profil;
    return !!(p?.website || p?.instagramUrl || p?.facebookUrl);
  }

  get hasContactInfo(): boolean {
    const p = this.profil;
    return !!(p?.address || p?.city || p?.phone || p?.openingHours);
  }

  /** Visuels pour la mosaïque (couverture + galerie, max 4). */
  get showcaseImages(): string[] {
    const imgs: string[] = [];
    if (this.profil?.imageUrl) imgs.push(this.profil.imageUrl);
    (this.profil?.galleryImages ?? []).forEach((u) => {
      if (u && !imgs.includes(u)) imgs.push(u);
    });
    return imgs.slice(0, 4);
  }

  get hasShowcase(): boolean {
    return this.showcaseImages.length > 0;
  }

  get offersCount(): number {
    return this.offres.length;
  }

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('userId');
    const partenaireUserId = Number(rawId);
    if (!partenaireUserId || Number.isNaN(partenaireUserId)) {
      this.erreur = 'Identifiant partenaire invalide.';
      this.loading = false;
      return;
    }

    if (this.isLoggedInCitizen) {
      const participantId = this.auth.getUserId();
      if (participantId != null) {
        this.loadParticipantPoints(participantId);
      }
    }

    this.partenaireService.getProfilPublic(partenaireUserId).subscribe({
      next: (profil) => {
        this.profil = profil;
        this.loading = false;
        this.loadOffres(partenaireUserId);
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  loadParticipantPoints(participantUserId: number): void {
    this.loadingSolde = true;
    this.userService.getPoints(participantUserId).subscribe({
      next: (response) => {
        this.soldePoints = typeof response?.totalPoints === 'number' ? response.totalPoints : 0;
        this.loadingSolde = false;
      },
      error: () => {
        this.soldePoints = 0;
        this.loadingSolde = false;
      }
    });
  }

  loadOffres(partenaireUserId: number): void {
    this.loadingOffres = true;
    this.recompenseService.getOffresByPartenaire(partenaireUserId).subscribe({
      next: (offres) => {
        this.offres = offres.filter(o => o.isActive && o.isAvailable);
        this.loadingOffres = false;
      },
      error: () => {
        this.recompenseService.getCatalogue().subscribe({
          next: (toutes) => {
            const nomPartenaire = this.profil?.name;
            this.offres = nomPartenaire
              ? toutes.filter(o => o.partenaireName === nomPartenaire && o.isActive && o.isAvailable)
              : [];
            this.loadingOffres = false;
          },
          error: (e2: Error) => {
            this.erreurOffres = e2.message;
            this.loadingOffres = false;
          }
        });
      }
    });
  }

  echangerOffre(offre: RecompenseItemDto): void {
    if (!this.isLoggedInCitizen || !offre.isAvailable || this.echangeEnCours) {
      if (!this.isLoggedInCitizen) {
        this.router.navigate(['/connexion'], { queryParams: { returnUrl: this.router.url } });
      }
      return;
    }

    if (this.soldePoints < offre.pointsNecessaires) return;

    const confirmation = confirm(
      `Échanger ${offre.pointsNecessaires} points contre « ${offre.title} » ?\n\n` +
      `Votre solde participant : ${this.soldePoints} pts → ${this.soldePoints - offre.pointsNecessaires} pts`
    );
    if (!confirmation) return;

    this.echangeEnCours = offre.id;

    this.recompenseService.echanger(offre.id).subscribe({
      next: async (coupon) => {
        this.couponGenere = coupon;
        this.qrCodeLoading = true;
        try {
          this.qrCodeDataUrl = await this.qrCodeService.generateQRCode(coupon.code);
        } catch {
          this.qrCodeDataUrl = '';
        } finally {
          this.qrCodeLoading = false;
        }

        this.showSuccessModal = true;
        this.echangeEnCours = null;

        const participantId = this.auth.getUserId();
        if (participantId != null) this.loadParticipantPoints(participantId);
        if (this.profil) this.loadOffres(this.profil.userId);
      },
      error: (e: Error) => {
        alert(`Erreur : ${e.message}`);
        this.echangeEnCours = null;
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      STOCK: 'Produit',
      REDUCTION: 'Réduction',
      SERVICE: 'Service',
      EXPERIENCE: 'Expérience'
    };
    return labels[type] || type;
  }

  canExchange(offre: RecompenseItemDto): boolean {
    return this.isLoggedInCitizen && this.soldePoints >= offre.pointsNecessaires;
  }

  getPointsManquants(offre: RecompenseItemDto): number {
    return Math.max(0, offre.pointsNecessaires - this.soldePoints);
  }

  exchangeTitle(offre: RecompenseItemDto): string {
    if (!this.isLoggedInCitizen) return 'Connectez-vous avec un compte participant';
    if (!this.canExchange(offre)) return `Il vous manque ${this.getPointsManquants(offre)} points`;
    return 'Échanger avec vos points';
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.couponGenere = null;
    this.qrCodeDataUrl = '';
  }

  async telechargerQRCode(): Promise<void> {
    if (!this.couponGenere) return;
    try {
      await this.qrCodeService.downloadQRCode(
        this.couponGenere.code,
        `coupon-${this.couponGenere.code}.png`
      );
    } catch {
      alert('Erreur lors du téléchargement du QR code');
    }
  }

  copierCode(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => alert('Code copié !')).catch(() => this.fallbackCopyCode(code));
    } else {
      this.fallbackCopyCode(code);
    }
  }

  private fallbackCopyCode(code: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = code;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); alert('Code copié !'); } catch { /* ignore */ }
    document.body.removeChild(textArea);
  }

  allerVersMesCoupons(): void {
    this.closeModal();
    this.router.navigate(['/espace/recompenses']);
  }

  onCoverError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImage;
  }

  onGalleryError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  onOfferImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
