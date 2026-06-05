import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActionService } from '../action/services/action.service';
import { ActionSummary, Category } from '../action/models/action.model';
import { getCategoryMeta } from '../action/constants/category-meta';
import {
  formatActionDate,
  formatPlacesLabel,
  formatTimeRange,
  isActionFull,
} from '../action/utils/action-format.utils';
import {
  CATEGORY_IMAGE_PLACEHOLDER,
  getCategoryImageUrl,
} from '../action/utils/category-image.util';
import { AuthService } from '../../core/services/auth.service';
import { PartenaireService } from '../recompense/partenaire.service';
import { RecompenseService } from '../recompense/recompense.service';
import { PartenaireProfil, RecompenseItemDto } from '../../core/models/recompense.model';
import { AccueilStatItem, ACCUEIL_FEATURED_DEMO } from './accueil.constants';
import { SITE_IMAGES } from '../../core/constants/site-images';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss',
})
export class AccueilComponent implements OnInit {
  stats: AccueilStatItem[] = [];
  loadingStats = true;
  readonly heroImage = SITE_IMAGES.heroPlanting;
  categories: Category[] = [];
  loadingCategories = true;
  categoriesError = false;
  readonly communityImage = SITE_IMAGES.communityGroup;
  readonly howItWorksImage = SITE_IMAGES.howItWorks;

  featuredActions: ActionSummary[] = [];
  spotlightAction: ActionSummary | null = null;
  loadingFeatured = true;
  partenaires: PartenaireProfil[] = [];
  loadingPartenaires = true;
  previewOffres: RecompenseItemDto[] = [];
  loadingOffres = true;
  private offreImageErrors: Record<number, boolean> = {};

  constructor(
    public auth: AuthService,
    private actionService: ActionService,
    private partenaireService: PartenaireService,
    private recompenseService: RecompenseService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPublicStats();

    this.actionService.getFeaturedActions(3).subscribe({
      next: (actions) => {
        this.featuredActions =
          actions.length > 0 ? actions.slice(0, 3) : [...ACCUEIL_FEATURED_DEMO];
        this.spotlightAction = this.featuredActions[0] ?? null;
        this.loadingFeatured = false;
      },
      error: () => {
        this.featuredActions = [...ACCUEIL_FEATURED_DEMO];
        this.spotlightAction = this.featuredActions[0] ?? null;
        this.loadingFeatured = false;
      },
    });

    this.recompenseService.getCatalogue().subscribe({
      next: (offres) => {
        const dispo = offres.filter((o) => o.isAvailable);
        const mystere = dispo.filter((o) => o.hasMystereBox);
        const autres = dispo.filter((o) => !o.hasMystereBox);
        this.previewOffres = [...mystere, ...autres].slice(0, 4);
        this.loadingOffres = false;
      },
      error: () => {
        this.previewOffres = [];
        this.loadingOffres = false;
      },
    });

    this.partenaireService.getPartenairesPublics().subscribe({
      next: (partenaires) => {
        this.partenaires = partenaires;
        this.loadingPartenaires = false;
      },
      error: () => {
        this.partenaires = [];
        this.loadingPartenaires = false;
      },
    });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  loadPublicStats(): void {
    this.loadingStats = true;
    this.actionService.getPublicStats().subscribe({
      next: (data) => {
        this.stats = [
          {
            value: this.formatStatNumber(data.actionsRealisees),
            label: 'Actions réalisées',
          },
          {
            value: this.formatStatNumber(data.participantsInscrits),
            label: 'Participants inscrits',
          },
          {
            value: this.formatStatNumber(data.actionsEnCours),
            label: 'Actions à venir',
          },
        ];
        this.loadingStats = false;
      },
      error: () => {
        this.stats = [];
        this.loadingStats = false;
      },
    });
  }

  private formatStatNumber(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(Math.max(0, n));
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoriesError = false;
    this.actionService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loadingCategories = false;
      },
      error: () => {
        this.categories = [];
        this.categoriesError = true;
        this.loadingCategories = false;
      },
    });
  }

  getCategoryCardImage(category: Category): string {
    return getCategoryImageUrl(category.name, category.imageUrl);
  }

  getCategorySubtitle(category: Category): string {
    const desc = category.description?.trim();
    if (desc) {
      return desc;
    }
    return getCategoryMeta(category.name).subtitle;
  }

  /** Photo action, sinon image catégorie (API), sinon icône locale */
  getFeaturedCardImage(action: ActionSummary): string {
    const photo = action.photoUrls?.[0]?.trim();
    if (photo) {
      return photo;
    }
    return getCategoryImageUrl(action.categoryName, action.categoryImageUrl);
  }

  onCategoryImageError(_category: Category, event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackApplied'] === '1') return;
    img.dataset['fallbackApplied'] = '1';
    img.src = CATEGORY_IMAGE_PLACEHOLDER;
  }

  onFeaturedImageError(_action: ActionSummary, event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallbackApplied'] === '1') return;
    img.dataset['fallbackApplied'] = '1';
    img.src = CATEGORY_IMAGE_PLACEHOLDER;
  }

  hasOffreImage(o: RecompenseItemDto): boolean {
    return !!o.imageUrl?.trim() && !this.offreImageErrors[o.id];
  }

  offreInitial(o: RecompenseItemDto): string {
    const t = o.title?.trim();
    if (t) return t.charAt(0).toUpperCase();
    const p = o.partenaireName?.trim();
    return p ? p.charAt(0).toUpperCase() : 'E';
  }

  onOffreImageError(o: RecompenseItemDto): void {
    this.offreImageErrors[o.id] = true;
  }

  featuredActionLink(action: ActionSummary): string[] {
    return action.id > 0 ? ['/action', String(action.id)] : ['/actions'];
  }

  categoryQuery(category: Category): { cat: string } {
    return { cat: getCategoryMeta(category.name).slug };
  }

  isFull = isActionFull;
  formatDate = formatActionDate;
  formatTime = formatTimeRange;
  formatPlaces = formatPlacesLabel;
}
