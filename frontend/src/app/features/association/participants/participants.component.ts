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
  actionTitle: string = '';
  
  // Données
  participants: Participant[] = [];
  filteredParticipants: Participant[] = [];
  stats: ParticipantsStats = { total: 0, confirmes: 0, enAttente: 0, annules: 0 };
  
  // États
  loading: boolean = true;
  error: string = '';
  
  // Filtres et recherche
  searchTerm: string = '';
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

  goBack(): void {
    this.router.navigate(['/association/action', this.actionId]);
  }
}
