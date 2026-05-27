import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { ActionSummary } from '../../action/models/action.model';

@Component({
  selector: 'app-mes-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mes-actions.component.html',
  styleUrls: ['./mes-actions.component.css']
})
export class MesActionsComponent implements OnInit {
  actionsPubliees: ActionSummary[] = [];
  brouillons: ActionSummary[] = [];
  loading = true;
  error: string | null = null;
  activeTab: 'publiees' | 'brouillons' = 'publiees';

  constructor(
    private associationService: AssociationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActions();
  }

  loadActions(): void {
    this.loading = true;
    this.error = null;

    // Charger les actions publiées
    this.associationService.getMesActions().subscribe({
      next: (actions) => {
        this.actionsPubliees = actions;
        this.loading = false;
      },
      error: (err) => {
        this.error = httpErrorMessage(
          err,
          'Impossible de charger les actions. Démarrez service-action (9090) et exécutez seed-dev-data.sql (db_action.associations, user_id=1).'
        );
        this.loading = false;
        console.error(err);
      }
    });

    // Charger les brouillons
    this.associationService.getMesBrouillons().subscribe({
      next: (brouillons) => {
        this.brouillons = brouillons;
      },
      error: (err) => {
        console.error('Erreur chargement brouillons:', err);
      }
    });
  }

  setActiveTab(tab: 'publiees' | 'brouillons'): void {
    this.activeTab = tab;
  }

  creerAction(): void {
    this.router.navigate(['/association/creer']);
  }

  modifierAction(actionId: number): void {
    this.router.navigate(['/association/modifier', actionId]);
  }

  voirDetails(actionId: number): void {
    this.router.navigate(['/association/action', actionId]);
  }

  publierBrouillon(actionId: number): void {
    if (confirm('Voulez-vous publier cette action ?')) {
      this.associationService.publierAction(actionId).subscribe({
        next: () => {
          alert('Action publiée avec succès !');
          this.loadActions();
        },
        error: (err) => {
          alert('Erreur lors de la publication');
          console.error(err);
        }
      });
    }
  }

  annulerAction(actionId: number): void {
    const raison = prompt('Raison de l\'annulation (optionnel) :');
    if (raison !== null) {
      this.associationService.annulerAction(actionId, raison).subscribe({
        next: () => {
          alert('Action annulée avec succès');
          this.loadActions();
        },
        error: (err) => {
          alert('Erreur lors de l\'annulation');
          console.error(err);
        }
      });
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  getStatutClass(action: ActionSummary): string {
    const fillRate = action.registeredCount / action.maxParticipants;
    if (fillRate >= 1) return 'complet';
    if (fillRate >= 0.8) return 'bientot-complet';
    return 'disponible';
  }

  getStatutLabel(action: ActionSummary): string {
    const fillRate = action.registeredCount / action.maxParticipants;
    if (fillRate >= 1) return 'Complet';
    if (fillRate >= 0.8) return 'Bientôt complet';
    return 'Publié';
  }

  getActionImage(action: ActionSummary): string {
    // Priorité: photo de l'action > image de catégorie > placeholder
    if (action.photoUrls && action.photoUrls.length > 0) {
      return action.photoUrls[0];
    }
    return action.categoryImageUrl || '/assets/placeholder-action.jpg';
  }

  getTotalInscrits(): number {
    return this.actionsPubliees.reduce((sum, action) => sum + action.registeredCount, 0);
  }

  /** Taux de remplissage moyen des actions publiées (données API action). */
  getAverageFillRate(): number {
    const withCapacity = this.actionsPubliees.filter(
      (a) => a.maxParticipants > 0 && !a.isFixed
    );
    if (withCapacity.length === 0) {
      return 0;
    }
    const sum = withCapacity.reduce((acc, a) => {
      return acc + (a.registeredCount / a.maxParticipants) * 100;
    }, 0);
    return Math.round(sum / withCapacity.length);
  }

  getTotalPoints(): number {
    return this.actionsPubliees.reduce(
      (sum, action) => sum + action.points * (action.registeredCount ?? 0),
      0
    );
  }
}
