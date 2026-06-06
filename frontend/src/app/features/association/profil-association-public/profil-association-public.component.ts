import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AssociationPublicService } from '../services/association-public.service';
import { ActionService } from '../../action/services/action.service';
import { AssociationPublicProfil } from '../models/association-public.model';
import { ActionSummary } from '../../action/models/action.model';

@Component({
  selector: 'app-profil-association-public',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profil-association-public.component.html',
  styleUrls: ['./profil-association-public.component.scss'],
})
export class ProfilAssociationPublicComponent implements OnInit {
  profil: AssociationPublicProfil | null = null;
  actions: ActionSummary[] = [];
  loading = true;
  loadingActions = true;
  erreur = '';
  erreurActions = '';

  private readonly fallbackImage = '/assets/images/event-affiche-2.jpg';

  constructor(
    private route: ActivatedRoute,
    private associationPublicService: AssociationPublicService,
    private actionService: ActionService
  ) {}

  ngOnInit(): void {
    const authId = Number(this.route.snapshot.paramMap.get('authId'));
    if (!authId || Number.isNaN(authId)) {
      this.erreur = 'Identifiant association invalide.';
      this.loading = false;
      return;
    }
    this.loadProfil(authId);
  }

  get associationInitial(): string {
    const name = this.profil?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  }

  get logoSrc(): string {
    return this.profil?.logo?.trim() || this.fallbackImage;
  }

  get hasContactInfo(): boolean {
    const p = this.profil;
    return !!(p?.address || p?.city);
  }

  loadProfil(authId: number): void {
    this.loading = true;
    this.associationPublicService.getAssociationPublic(authId).subscribe({
      next: (profil) => {
        this.profil = profil;
        this.loading = false;
        this.loadActions(authId);
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      },
    });
  }

  loadActions(authId: number): void {
    this.loadingActions = true;
    this.actionService.getAssociationPublishedActionsByAuthId(authId).subscribe({
      next: (actions) => {
        this.actions = actions;
        this.loadingActions = false;
      },
      error: (e: Error) => {
        this.erreurActions = e.message;
        this.loadingActions = false;
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
