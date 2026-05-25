import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActionService } from '../services/action.service';
import { ActionDetail } from '../models/action.model';
import { getCategoryMeta } from '../constants/category-meta';
import {
  formatActionDate,
  formatTimeRange,
  formatInscritsLabel,
  formatLieu,
  formatPlacesLabel,
  isActionFull,
} from '../utils/action-format.utils';

@Component({
  selector: 'app-detail-action',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-action.component.html',
  styleUrls: ['./detail-action.component.css'],
})
export class DetailActionComponent implements OnInit {
  action: ActionDetail | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actionService: ActionService
  ) {}

  ngOnInit(): void {
    const actionId = this.route.snapshot.paramMap.get('id');
    if (actionId) {
      this.loadAction(Number(actionId));
    } else {
      this.error = "ID d'action invalide";
      this.loading = false;
    }
  }

  loadAction(id: number): void {
    this.loading = true;
    this.error = null;

    this.actionService.getActionById(id).subscribe({
      next: (data) => {
        this.action = data;
        this.loading = false;
      },
      error: () => {
        this.error = "Cette action n'existe pas ou n'est plus disponible.";
        this.loading = false;
      },
    });
  }

  getCategoryColor(): string {
    return this.action
      ? getCategoryMeta(this.action.categoryName).color
      : '#2D6A4F';
  }

  getHeroImage(): string {
    if (!this.action) return '';
    return (
      this.action.photoUrls?.[0] ||
      this.action.categoryImageUrl ||
      `/assets/categories/${getCategoryMeta(this.action.categoryName).slug}.svg`
    );
  }

  isFull(): boolean {
    return this.action ? isActionFull(this.action) : false;
  }

  participate(): void {
    if (this.action && !this.isFull()) {
      this.router.navigate(['/inscription', this.action.id]);
    }
  }

  share(): void {
    if (!this.action) return;

    const shareData = {
      title: `${this.action.title} - Ecopria`,
      text: `Rejoignez-moi pour cette action : ${this.action.title}`,
      url: window.location.href
    };

    // Vérifier si l'API Web Share est disponible (mobile principalement)
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Partage réussi'))
        .catch((error) => {
          // Si l'utilisateur annule, ne rien faire
          if (error.name !== 'AbortError') {
            console.error('Erreur lors du partage:', error);
            this.fallbackShare();
          }
        });
    } else {
      // Fallback : copier le lien dans le presse-papiers
      this.fallbackShare();
    }
  }

  private fallbackShare(): void {
    const url = window.location.href;
    
    // Essayer de copier dans le presse-papiers
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('Lien copié dans le presse-papiers !');
        })
        .catch(() => {
          // Si la copie échoue, afficher le lien
          this.showShareDialog(url);
        });
    } else {
      // Méthode alternative pour les navigateurs plus anciens
      this.showShareDialog(url);
    }
  }

  private showShareDialog(url: string): void {
    const message = `Partagez cette action :\n\n${url}`;
    prompt('Copiez ce lien pour partager :', url);
  }

  goBack(): void {
    this.router.navigate(['/actions']);
  }

  getRegistrationPercent(): number {
    if (!this.action?.maxParticipants) return 0;
    return Math.min(
      100,
      Math.round((this.action.registeredCount / this.action.maxParticipants) * 100)
    );
  }

  formatDate = formatActionDate;
  formatTime = formatTimeRange;
  formatLieu = formatLieu;
  formatPlacesLabel = formatPlacesLabel;
  formatInscrits = formatInscritsLabel;
}
