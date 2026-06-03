import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PartenaireService } from '../partenaire.service';
import { RecompenseService } from '../recompense.service';
import { UserService } from '../../../core/services/user.service';
import { PartenaireProfil, RecompenseItemDto, CouponDto } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-profil-partenaire-public',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profil-partenaire-public.component.html',
  styleUrls: ['./profil-partenaire-public.component.scss']
})
export class ProfilPartenairePublicComponent implements OnInit {
  profil: PartenaireProfil | null = null;
  offres: RecompenseItemDto[] = [];
  loading = true;
  loadingOffres = true;
  erreur = '';
  erreurOffres = '';
  
  // Pour l'échange
  echangeEnCours: number | null = null;
  showSuccessModal = false;
  couponGenere: CouponDto | null = null;
  
  // Solde de points de l'utilisateur
  soldePoints: number = 0;
  isUserConnected: boolean = false;
  loadingSolde: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private partenaireService: PartenaireService,
    private recompenseService: RecompenseService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('userId');
    const userId = Number(rawId);
    if (!userId || Number.isNaN(userId)) {
      this.erreur = 'Identifiant partenaire invalide.';
      this.loading = false;
      return;
    }

    // Vérifier si l'utilisateur est connecté et charger son solde de points
    this.checkUserAuthentication();

    // Charger le profil
    this.partenaireService.getProfilPublic(userId).subscribe({
      next: (profil) => {
        this.profil = profil;
        this.loading = false;
        // Charger les offres du partenaire
        this.loadOffres(userId);
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  checkUserAuthentication(): void {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      const userId = Number(userIdStr);
      if (!isNaN(userId) && userId > 0) {
        this.isUserConnected = true;
        this.loadUserPoints(userId);
      }
    }
  }

  loadUserPoints(userId: number): void {
    this.loadingSolde = true;
    this.userService.getPoints(userId).subscribe({
      next: (response) => {
        this.soldePoints = response.totalPoints || 0;
        this.loadingSolde = false;
      },
      error: (e: Error) => {
        console.error('Erreur lors du chargement du solde de points:', e);
        this.soldePoints = 0;
        this.loadingSolde = false;
      }
    });
  }

  loadOffres(userId: number): void {
    // Utiliser le nouvel endpoint qui filtre côté backend
    this.recompenseService.getOffresByPartenaire(userId).subscribe({
      next: (offres) => {
        // Le backend retourne déjà les offres filtrées pour ce partenaire
        this.offres = offres.filter(o => o.isActive && o.isAvailable);
        this.loadingOffres = false;
      },
      error: (e: Error) => {
        // Si l'endpoint n'existe pas encore, fallback sur l'ancien système
        console.warn('Endpoint spécifique non disponible, utilisation du catalogue complet', e);
        this.recompenseService.getCatalogue().subscribe({
          next: (toutes) => {
            const nomPartenaire = this.profil?.name;
            if (nomPartenaire) {
              this.offres = toutes.filter(o => 
                o.partenaireName === nomPartenaire && 
                o.isActive && 
                o.isAvailable
              );
            } else {
              this.offres = [];
            }
            this.loadingOffres = false;
          },
          error: (e2: Error) => {
            this.erreurOffres = e2.message;
            this.loadingOffres = false;
          }
        });
      }
    });
  }

  echangerOffre(offre: RecompenseItemDto): void {
    if (!offre.isAvailable || this.echangeEnCours) return;

    // Vérifier si l'utilisateur est connecté
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr || !this.isUserConnected) {
      // Rediriger vers la page de connexion
      alert('Vous devez être connecté pour échanger des points.');
      this.router.navigate(['/connexion'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    // Vérifier si l'utilisateur a assez de points
    if (this.soldePoints < offre.pointsNecessaires) {
      alert(
        `Points insuffisants !\n\n` +
        `Votre solde : ${this.soldePoints} points\n` +
        `Requis : ${offre.pointsNecessaires} points\n` +
        `Manquant : ${offre.pointsNecessaires - this.soldePoints} points`
      );
      return;
    }

    // Confirmer l'échange
    const confirmation = confirm(
      `Voulez-vous échanger ${offre.pointsNecessaires} points contre cette offre ?\n\n` +
      `"${offre.title}"\n\n` +
      `Votre solde actuel : ${this.soldePoints} points\n` +
      `Solde après échange : ${this.soldePoints - offre.pointsNecessaires} points`
    );

    if (!confirmation) return;

    this.echangeEnCours = offre.id;

    this.recompenseService.echanger(offre.id).subscribe({
      next: (coupon) => {
        this.couponGenere = coupon;
        this.showSuccessModal = true;
        this.echangeEnCours = null;
        
        // Recharger le solde de points
        const userId = Number(userIdStr);
        this.loadUserPoints(userId);
        
        // Recharger les offres pour mettre à jour le stock
        if (this.profil) {
          this.loadOffres(this.profil.userId);
        }
      },
      error: (e: Error) => {
        // Le backend retourne des erreurs claires (points insuffisants, offre non disponible, etc.)
        alert(`Erreur : ${e.message}`);
        this.echangeEnCours = null;
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'STOCK': 'Produit',
      'REDUCTION': 'Réduction',
      'SERVICE': 'Service',
      'EXPERIENCE': 'Expérience'
    };
    return labels[type] || type;
  }

  hasEnoughPoints(offre: RecompenseItemDto): boolean {
    return this.isUserConnected && this.soldePoints >= offre.pointsNecessaires;
  }

  getPointsManquants(offre: RecompenseItemDto): number {
    return Math.max(0, offre.pointsNecessaires - this.soldePoints);
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.couponGenere = null;
  }

  allerVersMesCoupons(): void {
    this.closeModal();
    // Créer la route /espace/mes-coupons si elle n'existe pas encore
    // Pour l'instant, on va juste vers l'espace
    this.router.navigate(['/espace/recompenses']);
  }
}
