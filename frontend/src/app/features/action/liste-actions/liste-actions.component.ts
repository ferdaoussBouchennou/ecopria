import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActionService } from '../services/action.service';
import {
  ActionListFilters,
  ActionSourceFilter,
  ActionSummary,
  Category,
  SortBy,
} from '../models/action.model';
import { getCategoryMeta, CategoryMeta } from '../constants/category-meta';
import {
  formatActionDate,
  formatTimeRange,
  formatPlacesLabel,
  isActionFull,
} from '../utils/action-format.utils';

@Component({
  selector: 'app-liste-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './liste-actions.component.html',
  styleUrls: ['./liste-actions.component.css'],
})
export class ListeActionsComponent implements OnInit {
  actions: ActionSummary[] = [];
  categories: Category[] = [];

  selectedCategoryId: number | null = null;
  sourceFilter: ActionSourceFilter = 'all';
  sortBy: SortBy = 'date';

  loading = false;
  error: string | null = null;

  constructor(
    private actionService: ActionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.route.queryParamMap.subscribe((params) => {
      const catSlug = params.get('cat');
      const source = params.get('source') as ActionSourceFilter | null;
      const sort = params.get('sort') as SortBy | null;

      if (source && ['all', 'association', 'fixed'].includes(source)) {
        this.sourceFilter = source;
      }
      if (sort && ['date', 'points', 'places'].includes(sort)) {
        this.sortBy = sort;
      }

      if (catSlug && this.categories.length) {
        this.applyCategorySlug(catSlug);
      } else if (!catSlug) {
        this.selectedCategoryId = null;
      }

      this.loadActions();
    });
  }

  loadCategories(): void {
    this.actionService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        const catSlug = this.route.snapshot.queryParamMap.get('cat');
        if (catSlug) {
          this.applyCategorySlug(catSlug);
          this.loadActions();
        }
      },
      error: (err) => console.error('Catégories', err),
    });
  }

  private applyCategorySlug(slug: string): void {
    const match = this.categories.find(
      (c) => getCategoryMeta(c.name).slug === slug
    );
    this.selectedCategoryId = match?.id ?? null;
  }

  loadActions(): void {
    this.loading = true;
    this.error = null;

    const filters: ActionListFilters = {
      categoryId: this.selectedCategoryId ?? undefined,
      categoryName: this.categories.find((c) => c.id === this.selectedCategoryId)?.name,
      source: this.sourceFilter,
      sort: this.sortBy,
    };

    this.actionService.getActions(filters).subscribe({
      next: (data) => {
        this.actions = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les actions pour le moment.';
        this.loading = false;
      },
    });
  }

  selectCategory(categoryId: number | null): void {
    if (this.selectedCategoryId === categoryId) {
      return;
    }
    this.selectedCategoryId = categoryId;
    this.updateQueryParams();
    this.loadActions();
  }

  setSource(source: ActionSourceFilter): void {
    this.sourceFilter = source;
    this.updateQueryParams();
    this.loadActions();
  }

  setSort(sort: SortBy): void {
    this.sortBy = sort;
    this.updateQueryParams();
    this.loadActions();
  }

  private updateQueryParams(): void {
    const cat =
      this.selectedCategoryId != null
        ? getCategoryMeta(
            this.categories.find((c) => c.id === this.selectedCategoryId)?.name ??
              ''
          ).slug
        : null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        cat: cat || null,
        source: this.sourceFilter === 'all' ? null : this.sourceFilter,
        sort: this.sortBy === 'date' ? null : this.sortBy,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  getCategoryMeta(name: string): CategoryMeta {
    return getCategoryMeta(name);
  }

  getActionImage(action: ActionSummary): string {
    // Priorité: photo de l'action > image de catégorie > icône de catégorie
    if (action.photoUrls && action.photoUrls.length > 0) {
      return action.photoUrls[0];
    }
    return (
      action.categoryImageUrl ||
      `/assets/categories/${getCategoryMeta(action.categoryName).slug}.svg`
    );
  }

  isFull = isActionFull;
  formatDate = formatActionDate;
  formatTime = formatTimeRange;
  formatPlaces = formatPlacesLabel;
}
