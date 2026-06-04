import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-recompenses-publique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recompenses-publique.component.html',
  styleUrls: ['./recompenses-publique.component.scss']
})
export class RecompensesPubliqueComponent implements OnInit {
  offres: RecompenseItemDto[] = [];
  partenaires: PartenaireProfil[] = [];
  loading = true;
  erreur = '';

  searchQuery = '';
  activeFilter: FilterKey = 'ALL';

  soldePoints = 0;
  loadingSolde = false;
  actionId: number | null = null;

  showCouponModal = false;
  showMystereModal = false;
  showLoginHint = false;
  mystereReveal = false;
  dernierCoupon: CouponDto | null = null;
  mystereResult: ResultatMystereBox | null = null;
  pendingAction: 'echanger' | 'mystere' | null = null;
  pendingOffre: RecompenseItemDto | null = null;

  readonly filters: { key: FilterKey; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Tout', icon: '✦' },
    { key: 'MYSTERE', label: 'Boîte mystère', icon: '🎁' },
    { key: 'REDUCTION', label: 'Réductions', icon: '%' },
    { key: 'STOCK', label: 'Produits', icon: '◆' },
    { key: 'SERVICE', label: 'Services', icon: '◎' },
    { key: 'EXPERIENCE', label: 'Expériences', icon: '★' }
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

  get isLoggedInCitizen(): boolean {
    return this.auth.isLoggedIn() && this.auth.getRole() === 'USER';
  }

  get offresMystere(): RecompenseItemDto[] {
    return this.offres.filter((o) => o.hasMystereBox && o.isAvailable);
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

  get statsTotal(): number {
    return this.offres.filter((o) => o.isAvailable).length;
  }

  get statsMystere(): number {
    return this.offresMystere.length;
  }

  ngOnInit(): void {
    forkJoin({
      offres: this.recompenseService.getCatalogue(),
      partenaires: this.partenaireService.getPartenairesPublics()
    }).subscribe({
      next: ({ offres, partenaires }) => {
        this.offres = offres;
        this.partenaires = partenaires;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });

    const userId = this.auth.getUserId();
    if (userId != null && this.isLoggedInCitizen) {
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
  }

  setFilter(key: FilterKey): void {
    this.activeFilter = key;
  }

  typeLabel(type: RecompenseType): string {
    return this.typeLabels[type] ?? type;
  }

  trackOffre(_: number, o: RecompenseItemDto): number {
    return o.id;
  }

  onCardClick(o: RecompenseItemDto): void {
    this.recompenseService.enregistrerClic(o.id).subscribe({ error: () => {} });
  }

  echanger(o: RecompenseItemDto): void {
    if (!o.isAvailable) return;
    if (!this.ensureCitizenLogin()) return;
    this.pendingOffre = o;
    this.pendingAction = 'echanger';
  }

  ouvrirMystere(o: RecompenseItemDto): void {
    if (!o.hasMystereBox || !o.mystereBoxPoints || !o.isAvailable) return;
    if (!this.ensureCitizenLogin()) return;
    this.pendingOffre = o;
    this.pendingAction = 'mystere';
  }

  annulerPending(): void {
    this.pendingOffre = null;
    this.pendingAction = null;
  }

  confirmerPending(): void {
    const o = this.pendingOffre;
    const action = this.pendingAction;
    if (!o || !action) return;

    const cost = action === 'mystere' ? (o.mystereBoxPoints ?? 0) : o.pointsNecessaires;
    if (this.soldePoints < cost) {
      this.erreurAction = `Il vous manque ${cost - this.soldePoints} point(s) pour cette opération.`;
      return;
    }

    this.actionId = o.id;
    this.erreurAction = '';
    this.annulerPending();

    if (action === 'echanger') {
      this.recompenseService.echanger(o.id).subscribe({
        next: (c) => {
          this.dernierCoupon = c;
          this.showCouponModal = true;
          this.actionId = null;
          this.refreshSolde();
        },
        error: (e: Error) => {
          this.erreurAction = e.message;
          this.actionId = null;
        }
      });
    } else {
      this.mystereReveal = false;
      this.recompenseService.ouvrirMystereBox(o.id).subscribe({
        next: (r) => {
          this.mystereResult = r;
          this.showMystereModal = true;
          setTimeout(() => (this.mystereReveal = true), 120);
          this.actionId = null;
          this.refreshSolde();
        },
        error: (e: Error) => {
          this.erreurAction = e.message;
          this.actionId = null;
        }
      });
    }
  }

  erreurAction = '';

  fermerModals(): void {
    this.showCouponModal = false;
    this.showMystereModal = false;
    this.showLoginHint = false;
    this.mystereReveal = false;
    this.dernierCoupon = null;
    this.mystereResult = null;
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
    if (userId == null) return;
    this.userService.getPoints(userId).subscribe({
      next: (res) => (this.soldePoints = res.totalPoints ?? 0),
      error: () => {}
    });
  }

  discountLabel(o: RecompenseItemDto): string | null {
    if (o.type === 'REDUCTION' && o.discountPercentage) {
      return `-${o.discountPercentage}%`;
    }
    return null;
  }
}
