import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AssociationPublicService } from '../services/association-public.service';
import { AssociationPublicProfil } from '../models/association-public.model';

@Component({
  selector: 'app-liste-associations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './liste-associations.component.html',
  styleUrls: ['./liste-associations.component.scss'],
})
export class ListeAssociationsComponent implements OnInit {
  associations: AssociationPublicProfil[] = [];
  filteredAssociations: AssociationPublicProfil[] = [];
  loading = true;
  erreur = '';

  searchText = '';
  selectedCity = '';
  cities: string[] = [];

  constructor(private associationPublicService: AssociationPublicService) {}

  ngOnInit(): void {
    this.loadAssociations();
  }

  loadAssociations(): void {
    this.loading = true;
    this.erreur = '';
    this.associationPublicService.getAssociationsPublics().subscribe({
      next: (associations) => {
        this.associations = associations;
        this.filteredAssociations = associations;
        this.cities = [
          ...new Set(
            associations
              .map((a) => a.city)
              .filter((c): c is string => !!c && c.trim().length > 0)
          ),
        ].sort((a, b) => a.localeCompare(b, 'fr'));
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.associations];

    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          (a.description && a.description.toLowerCase().includes(search)) ||
          (a.city && a.city.toLowerCase().includes(search)) ||
          (a.address && a.address.toLowerCase().includes(search))
      );
    }

    if (this.selectedCity) {
      filtered = filtered.filter((a) => a.city === this.selectedCity);
    }

    this.filteredAssociations = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCityChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCity = '';
    this.filteredAssociations = [...this.associations];
  }

  logoUrl(association: AssociationPublicProfil): string {
    return association.logo?.trim() || '';
  }

  hasLogo(association: AssociationPublicProfil): boolean {
    return !!association.logo?.trim();
  }

  associationInitial(association: AssociationPublicProfil): string {
    const name = association.name?.trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.nextElementSibling;
    if (fallback instanceof HTMLElement) {
      fallback.classList.add('is-visible');
    }
  }
}
