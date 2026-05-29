import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ParticipantsService } from '../services/participants.service';
import { AssociationService } from '../services/association.service';
import { ActionDetail } from '../../action/models/action.model';
import { 
  Participant, 
  ParticipantsStats, 
  StatutFilter, 
  SortColumn, 
  SortDirection 
} from '../models/participant.model';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './participants.component.html',
  styleUrl: './participants.component.scss'
})
export class ParticipantsComponent implements OnInit {
  actionId!: number;
  actionTitle = '';
  
  // Données
  participants: Participant[] = [];
  filteredParticipants: Participant[] = [];
  stats: ParticipantsStats = { total: 0, confirmes: 0, enAttente: 0, annules: 0 };
  
  // États
  loading = true;
  error = '';
  pinCode: string | null = null;
  validerLoading: Record<number, boolean> = {};
  
  // Filtres et recherche
  searchTerm = '';
  statutFilter: StatutFilter = 'TOUS';
  
  // Tri
  sortColumn: SortColumn = 'dateInscription';
  sortDirection: SortDirection = 'desc';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private participantsService: ParticipantsService,
    private associationService: AssociationService
  ) {}

  ngOnInit(): void {
    this.actionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    // Charger les détails de l'action pour le titre
    this.associationService.getAction(this.actionId).subscribe({
      next: (action: ActionDetail) => {
        this.actionTitle = action.title;
        // Fetch PIN code if action has registrations
        if (action.registeredCount > 0) {
          this.associationService.getQRCode(this.actionId).subscribe({
            next: (qr) => this.pinCode = qr.pinCode,
            error: (err) => console.error('Erreur chargement PIN', err)
          });
        }
      },
      error: (err: Error) => {
        console.error('Erreur chargement action:', err);
      }
    });

    // Charger les participants
    this.participantsService.getParticipants(this.actionId).subscribe({
      next: (participants) => {
        this.participants = participants;
        this.stats = this.participantsService.calculateStats(participants);
        this.applyFilters();
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Erreur lors du chargement des participants';
        this.loading = false;
        console.error(err);
      }
    });
  }


  // Filtrage et recherche
  applyFilters(): void {
    let filtered = [...this.participants];

    // Filtre par statut
    if (this.statutFilter !== 'TOUS') {
      filtered = filtered.filter(p => p.statut === this.statutFilter);
    }

    // Recherche par nom/email
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.firstName?.toLowerCase().includes(term) ||
        p.lastName?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortColumn) {
        case 'nom':
          const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
          const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        
        case 'dateInscription':
          comparison = new Date(a.dateInscription).getTime() - new Date(b.dateInscription).getTime();
          break;
        
        case 'statut':
          comparison = a.statut.localeCompare(b.statut);
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredParticipants = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatutFilterChange(statut: StatutFilter): void {
    this.statutFilter = statut;
    this.applyFilters();
  }

  onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      // Inverser la direction si même colonne
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouvelle colonne, tri ascendant par défaut
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Export CSV
  exportCSV(): void {
    this.participantsService.exportToCSV(this.filteredParticipants, this.actionTitle);
  }

  // Helpers pour le template
  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'CONFIRMEE': 'statut-confirme',
      'EN_ATTENTE': 'statut-attente',
      'ANNULEE': 'statut-annule'
    };
    return classes[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'CONFIRMEE': 'Confirmé',
      'EN_ATTENTE': 'En attente',
      'ANNULEE': 'Annulé'
    };
    return labels[statut] || statut;
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getParticipationRate(): number {
    if (this.stats.total === 0) {
      return 0;
    }
    return Math.round((this.stats.confirmes / this.stats.total) * 100);
  }

  getPendingRate(): number {
    if (this.stats.total === 0) {
      return 0;
    }
    return Math.round((this.stats.enAttente / this.stats.total) * 100);
  }

  getTotalPoints(): number {
    return this.participants.reduce((total, participant) => total + participant.pointsAction, 0);
  }

  getLatestRegistrationLabel(): string {
    if (this.participants.length === 0) {
      return 'Aucune inscription pour le moment';
    }

    const latest = [...this.participants].sort(
      (a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime()
    )[0];

    return `${latest.firstName} ${latest.lastName}`.trim();
  }

  getTopCity(): string {
    const cityCounts = this.participants.reduce<Record<string, number>>((acc, participant) => {
      const city = participant.city?.trim();
      if (!city || city === '—') {
        return acc;
      }
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const [city] = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0] ?? [];
    return city || 'Aucune ville dominante';
  }

  getTopCityCount(): number {
    const city = this.getTopCity();
    if (city === 'Aucune ville dominante') {
      return 0;
    }
    return this.participants.filter((participant) => participant.city === city).length;
  }

  getParticipantSummary(): string {
    if (this.stats.total === 0) {
      return "Aucun participant n'est encore inscrit. Activez la communication ou partagez votre action pour lancer la mobilisation.";
    }

    return `${this.stats.confirmes} participant(s) confirmé(s), ${this.stats.enAttente} en attente et ${this.stats.annules} annulé(s) pour cette action.`;
  }

  goBack(): void {
    this.router.navigate(['/association/action', this.actionId]);
  }

  validerPresence(participant: Participant): void {
    if (!this.pinCode) {
      alert("Le code PIN de l'action n'est pas disponible.");
      return;
    }
    
    this.validerLoading[participant.userId] = true;
    this.associationService.validerPresenceParPin(this.pinCode, participant.userId).subscribe({
      next: (res) => {
        alert(`Présence validée pour ${participant.firstName} ${participant.lastName} !`);
        // We could change the local object to reflect the change, but it's best to reload data
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.erreur || err.message || 'Erreur lors de la validation';
        alert(`Erreur: ${msg}`);
        this.validerLoading[participant.userId] = false;
      }
    });
  }
}
