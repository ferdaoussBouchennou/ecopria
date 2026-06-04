import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RecompenseService } from '../recompense.service';
import { PartenaireService } from '../partenaire.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import {
  CouponDto,
  PartenaireProfil,
  RecompenseItemDto,
  RecompenseType,
  ResultatMystereBox
} from '../../../core/models/recompense.model';

type FilterKey = 'ALL' | RecompenseType | 'MYSTERE';
type MystereScenePhase = 'idle' | 'opening' | 'confirm' | 'result';

@Component({
  selector: 'app-recompenses-publique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recompenses-publique.component.html',
  styleUrls: ['./recompenses-publique.component.scss']
})
export class RecompensesPubliqueComponent implements OnInit, OnDestroy {
  offres: RecompenseItemDto[] = [];
  partenaires: PartenaireProfil[] = [];
  loading = true;
  erreur = '';

  searchQuery = '';
  activeFilter: FilterKey = 'ALL';

  soldePoints = 0;
  loadingSolde = false;
  actionId: number | null = null;

  selectedOffre: RecompenseItemDto | null = null;
  detailLoading = false;

  showCouponModal = false;
  showLoginHint = false;
  mystereReveal = false;
  dernierCoupon: CouponDto | null = null;
  mystereResult: ResultatMystereBox | null = null;
  pendingAction: 'echanger' | 'mystere' | null = null;
  pendingOffre: RecompenseItemDto | null = null;

  mystereSceneOffre: RecompenseItemDto | null = null;
  mystereScenePhase: MystereScenePhase = 'idle';
  mystereOffreEnAttente: RecompenseItemDto | null = null;
  private openingTimer: ReturnType<typeof setTimeout> | null = null;
  /** Images cassées ou URL invalides → placeholder. */
  imageErrors: Record<number, boolean> = {};
  partnerImageErrors: Record<number, boolean> = {};

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'Tout' },
    { key: 'MYSTERE', label: 'Boîte mystère' },
    { key: 'REDUCTION', label: 'Réductions' },
    { key: 'STOCK', label: 'Produits' },
    { key: 'SERVICE', label: 'Services' },
    { key: 'EXPERIENCE', label: 'Expériences' }
  ];

  readonly typeLabels: Record<RecompenseType, string> = {
    STOCK: 'Produit',
    REDUCTION: 'Réduction',
    SERVICE: 'Service',
    EXPERIENCE: 'Expérience'
  };

  constructor(
    private recompenseService: RecompenseService,
    private partenaireService: PartenaireService,
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mystereScenePhase !== 'idle') {
      this.fermerSceneBoite();
      return;
    }
    if (this.pendingOffre) {
      this.annulerPending();
      return;
    }
    if (this.showCouponModal || this.showLoginHint) {
      this.fermerModals();
      return;
    }
    if (this.selectedOffre) {
      this.fermerDetail();
    }
  }

  get isLoggedInCitizen(): boolean {
    return this.auth.isLoggedIn() && this.auth.getRole() === 'USER';
  }

  get filteredOffres(): RecompenseItemDto[] {
    let list = this.offres.filter((o) => o.isAvailable);
    if (this.activeFilter === 'MYSTERE') {
      list = list.filter((o) => o.hasMystereBox);
    } else if (this.activeFilter !== 'ALL') {
      list = list.filter((o) => o.type === this.activeFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.partenaireName.toLowerCase().includes(q) ||
          (o.partenaireCategory?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }

  get gridOffres(): RecompenseItemDto[] {
    return this.filteredOffres;
  }

  get flyoutSlots(): number[] {
    const n = this.mystereSceneOffre
      ? Math.min(5, Math.max(3, this.mystereHiddenCount(this.mystereSceneOffre)))
      : 3;
    return Array.from({ length: n }, (_, i) => i);
  }

  ngOnInit(): void {
    forkJoin({
      offres: this.recompenseService.getCatalogue(),
      partenaires: this.partenaireService.getPartenairesPublics()
    }).subscribe({
      next: ({ offres, partenaires }) => {
        this.offres = offres.map((o) => this.sanitizePublicOffre(o));
        this.partenaires = partenaires;
        this.loading = false;
        this.reprendreBoiteApresConnexion();
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });

    this.refreshSolde();
  }

  ngOnDestroy(): void {
    if (this.openingTimer) {
      clearTimeout(this.openingTimer);
    }
  }

  setFilter(key: FilterKey): void {
    this.activeFilter = key;
    this.scrollToSection('catalogue');
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  typeLabel(type: RecompenseType): string {
    return this.typeLabels[type] ?? type;
  }

  metaLine(o: RecompenseItemDto): string {
    const cat = (o.partenaireCategory || this.typeLabel(o.type)).toUpperCase();
    return `${cat} · ${o.partenaireName.toUpperCase()}`;
  }

  stockLabel(o: RecompenseItemDto): string | null {
    if (o.stock == null) return null;
    return `STOCK ${o.stock}`;
  }

  echangerLabel(o: RecompenseItemDto): string {
    return o.hasMystereBox ? 'Réserver' : 'Échanger';
  }

  mystereHiddenCount(o: RecompenseItemDto): number {
    return o.mystereBoxHiddenCount ?? 3;
  }

  trackOffre(_: number, o: RecompenseItemDto): number {
    return o.id;
  }

  hasCardImage(o: RecompenseItemDto): boolean {
    return !!o.imageUrl && !this.imageErrors[o.id];
  }

  onCardImageError(id: number): void {
    this.imageErrors = { ...this.imageErrors, [id]: true };
  }

  cardInitial(o: RecompenseItemDto): string {
    const t = o.title?.trim();
    return t ? t.charAt(0).toUpperCase() : '?';
  }

  hasPartnerImage(p: PartenaireProfil): boolean {
    return !!p.imageUrl && !this.partnerImageErrors[p.userId];
  }

  onPartnerImageError(userId: number): void {
    this.partnerImageErrors = { ...this.partnerImageErrors, [userId]: true };
  }

  partnerInitial(p: PartenaireProfil): string {
    const n = p.name?.trim();
    return n ? n.charAt(0).toUpperCase() : '?';
  }

  ouvrirDetail(o: RecompenseItemDto): void {
    this.recompenseService.enregistrerClic(o.id).subscribe({ error: () => {} });
    this.selectedOffre = o;
    this.detailLoading = true;
    this.recompenseService.getDetail(o.id).subscribe({
      next: (detail) => {
        this.selectedOffre = this.sanitizePublicOffre(detail);
        this.detailLoading = false;
      },
      error: () => {
        this.detailLoading = false;
      }
    });
  }

  fermerDetail(): void {
    this.selectedOffre = null;
    this.detailLoading = false;
  }

  clicBoiteFermee(o: RecompenseItemDto, event?: Event): void {
    event?.stopPropagation();
    if (!o.hasMystereBox || !o.mystereBoxPoints || !o.isAvailable) return;

    if (!this.auth.isLoggedIn()) {
      this.mystereOffreEnAttente = o;
      sessionStorage.setItem('rew-mystere-pending', String(o.id));
      this.showLoginHint = true;
      return;
    }
    if (!this.isLoggedInCitizen) {
      this.erreurAction = 'Seuls les comptes citoyens peuvent ouvrir une boîte mystère.';
      return;
    }
    this.fermerDetail();
    this.demarrerSceneBoite(o);
  }

  demarrerSceneBoite(o: RecompenseItemDto): void {
    if (this.openingTimer) {
      clearTimeout(this.openingTimer);
    }
    this.mystereSceneOffre = o;
    this.mystereScenePhase = 'opening';
    this.mystereResult = null;
    this.mystereReveal = false;
    this.erreurAction = '';

    this.openingTimer = setTimeout(() => {
      this.mystereScenePhase = 'confirm';
      this.openingTimer = null;
    }, 1500);
  }

  fermerSceneBoite(): void {
    if (this.openingTimer) {
      clearTimeout(this.openingTimer);
      this.openingTimer = null;
    }
    this.mystereSceneOffre = null;
    this.mystereScenePhase = 'idle';
    this.mystereResult = null;
    this.mystereReveal = false;
  }

  confirmerOuvertureBoite(): void {
    const o = this.mystereSceneOffre;
    if (!o?.mystereBoxPoints) return;

    if (this.soldePoints < o.mystereBoxPoints) {
      this.erreurAction = `Il vous manque ${o.mystereBoxPoints - this.soldePoints} point(s).`;
      return;
    }

    this.actionId = o.id;
    this.erreurAction = '';
    this.recompenseService.ouvrirMystereBox(o.id).subscribe({
      next: (r) => {
        this.mystereResult = r;
        this.mystereScenePhase = 'result';
        setTimeout(() => (this.mystereReveal = true), 80);
        this.actionId = null;
        this.refreshSolde();
      },
      error: (e: Error) => {
        this.erreurAction = e.message;
        this.actionId = null;
        this.mystereScenePhase = 'confirm';
      }
    });
  }

  echanger(o: RecompenseItemDto): void {
    if (!o.isAvailable) return;
    if (!this.ensureCitizenLogin()) return;
    this.pendingOffre = o;
    this.pendingAction = 'echanger';
  }

  annulerPending(): void {
    this.pendingOffre = null;
    this.pendingAction = null;
  }

  confirmerPending(): void {
    const o = this.pendingOffre;
    const action = this.pendingAction;
    if (!o || action !== 'echanger') return;

    if (this.soldePoints < o.pointsNecessaires) {
      this.erreurAction = `Il vous manque ${o.pointsNecessaires - this.soldePoints} point(s).`;
      return;
    }

    this.actionId = o.id;
    this.erreurAction = '';
    this.annulerPending();

    this.recompenseService.echanger(o.id).subscribe({
      next: (c) => {
        this.dernierCoupon = c;
        this.showCouponModal = true;
        this.fermerDetail();
        this.actionId = null;
        this.refreshSolde();
      },
      error: (e: Error) => {
        this.erreurAction = e.message;
        this.actionId = null;
      }
    });
  }

  erreurAction = '';

  fermerModals(): void {
    this.showCouponModal = false;
    this.showLoginHint = false;
    this.dernierCoupon = null;
  }

  private reprendreBoiteApresConnexion(): void {
    const raw = sessionStorage.getItem('rew-mystere-pending');
    if (!raw || !this.isLoggedInCitizen) return;
    sessionStorage.removeItem('rew-mystere-pending');
    const id = Number(raw);
    const o = this.offres.find((x) => x.id === id && x.hasMystereBox);
    if (o) {
      this.demarrerSceneBoite(o);
    }
  }

  private ensureCitizenLogin(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.showLoginHint = true;
      return false;
    }
    if (this.auth.getRole() !== 'USER') {
      this.erreurAction = 'Seuls les comptes citoyens peuvent échanger des points.';
      return false;
    }
    return true;
  }

  allerConnexion(): void {
    void this.router.navigate(['/connexion'], { queryParams: { returnUrl: '/recompenses' } });
  }

  private refreshSolde(): void {
    const userId = this.auth.getUserId();
    if (userId == null || !this.isLoggedInCitizen) {
      this.soldePoints = 0;
      this.loadingSolde = false;
      return;
    }
    this.loadingSolde = true;
    this.userService.getPoints(userId).subscribe({
      next: (res) => {
        this.soldePoints = res.totalPoints ?? 0;
        this.loadingSolde = false;
      },
      error: () => {
        this.soldePoints = 0;
        this.loadingSolde = false;
      }
    });
  }

  private sanitizePublicOffre(o: RecompenseItemDto): RecompenseItemDto {
    const copy = { ...o };
    if (copy.hasMystereBox) {
      const count = copy.mystereBoxHiddenCount ?? copy.mystereBoxItems?.length ?? 0;
      copy.mystereBoxHiddenCount = count > 0 ? count : undefined;
      copy.mystereBoxItems = undefined;
    }
    return copy;
  }

  discountLabel(o: RecompenseItemDto): string | null {
    if (o.type === 'REDUCTION' && o.discountPercentage) {
      return `-${o.discountPercentage}%`;
    }
    return null;
  }

  partenaireLink(o: RecompenseItemDto): (string | number)[] {
    return ['/partenaires', o.partenaireUserId ?? o.partenaireId];
  }

  isPrizeGood(): boolean {
    if (!this.mystereResult) return true;
    return (this.mystereResult.probabilite ?? 0) >= 25;
  }
}
