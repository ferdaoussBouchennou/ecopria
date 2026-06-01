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

  /** Image par carte (évite le même visuel pour toutes les actions sans photo) */
  getFeaturedCardImage(action: ActionSummary, index: number): string {
    const photo = action.photoUrls?.[0]?.trim();
    if (photo) {
      return photo;
    }
    return (
      ACCUEIL_FEATURED_IMAGES[index] ??
      `/assets/categories/${getCategoryMeta(action.categoryName).slug}.svg`
    );
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
