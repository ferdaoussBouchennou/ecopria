import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../partenaire.service';
import { PartenaireProfil } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-liste-partenaires',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './liste-partenaires.component.html',
  styleUrls: ['./liste-partenaires.component.scss']
})
export class ListePartenairesComponent implements OnInit {
  partenaires: PartenaireProfil[] = [];
  filteredPartenaires: PartenaireProfil[] = [];
  loading = true;
  erreur = '';

  // Filtres
  searchText = '';
  selectedCategory = '';
  categories: string[] = [];

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.loadPartenaires();
  }

  loadPartenaires(): void {
    this.partenaireService.getPartenairesPublics().subscribe({
      next: (partenaires) => {
        this.partenaires = partenaires;
        this.filteredPartenaires = partenaires;
        
        // Extraire les catégories uniques
        this.categories = [...new Set(partenaires
          .map(p => p.category)
          .filter((c): c is string => c !== null && c !== undefined && c.trim().length > 0)
        )].sort();

        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.partenaires];

    // Filtre par texte de recherche
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.city && p.city.toLowerCase().includes(search))
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    this.filteredPartenaires = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCategory = '';
    this.filteredPartenaires = [...this.partenaires];
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/event-affiche-2.jpg';
  }
}
