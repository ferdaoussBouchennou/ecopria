import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActionService } from '../action/services/action.service';
import { ActionSummary } from '../action/models/action.model';
import { getCategoryMeta } from '../action/constants/category-meta';
import {
  formatActionDate,
  formatPlacesLabel,
  formatTimeRange,
  isActionFull,
} from '../action/utils/action-format.utils';
import { AuthService } from '../../core/services/auth.service';
import {
  ACCUEIL_CATEGORY_CARDS,
  ACCUEIL_FEATURED_DEMO,
  ACCUEIL_FEATURED_IMAGES,
  ACCUEIL_STATS,
} from './accueil.constants';
import { SITE_IMAGES } from '../../core/constants/site-images';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss',
})
export class AccueilComponent implements OnInit {
  readonly stats = ACCUEIL_STATS;
  readonly categoryCards = ACCUEIL_CATEGORY_CARDS;
  readonly heroImage = SITE_IMAGES.heroPlanting;
  readonly communityImage = SITE_IMAGES.communityGroup;
  readonly howItWorksImage = SITE_IMAGES.howItWorks;

  featuredActions: ActionSummary[] = [];
  spotlightAction: ActionSummary | null = null;
  loadingFeatured = true;

  constructor(
    public auth: AuthService,
    private actionService: ActionService
  ) {}

  ngOnInit(): void {
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
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  /** Image par carte — index pour varier les 3 visuels, puis catégorie en secours */
  getFeaturedCardImage(action: ActionSummary, index: number): string {
    const photo = action.photoUrls?.[0]?.trim();
    if (photo) {
      return photo;
    }
    if (ACCUEIL_FEATURED_IMAGES[index]) {
      return ACCUEIL_FEATURED_IMAGES[index];
    }
    const categoryKey = action.categoryName as keyof typeof SITE_IMAGES.featured;
    const byCategory = SITE_IMAGES.featured[categoryKey];
    if (byCategory) {
      return byCategory;
    }
    return `/assets/categories/${getCategoryMeta(action.categoryName).slug}.svg`;
  }

  featuredActionLink(action: ActionSummary): string[] {
    return action.id > 0 ? ['/action', String(action.id)] : ['/actions'];
  }

  categoryQuery(slug: string): { cat: string } {
    return { cat: slug };
  }

  isFull = isActionFull;
  formatDate = formatActionDate;
  formatTime = formatTimeRange;
  formatPlaces = formatPlacesLabel;
}
