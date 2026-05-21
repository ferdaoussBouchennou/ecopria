import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InscriptionService } from '../../services/inscription.service';
import { InscriptionResponse } from '../../models/inscription.model';

@Component({
  selector: 'app-mes-inscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mes-inscriptions.component.html',
  styleUrls: ['./mes-inscriptions.component.css']
})
export class MesInscriptionsComponent implements OnInit {

  inscriptions: InscriptionResponse[] = [];
  loading = true;
  erreurMessage = '';
  annulationEnCours: number | null = null;

  // TODO: remplacer par votre AuthService quand l'auth sera branchee
  private readonly userId = 1;

  constructor(private inscriptionService: InscriptionService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreurMessage = '';

    this.inscriptionService.getMesInscriptions(this.userId).subscribe({
      next: (list: InscriptionResponse[]) => {
        // Tri : CONFIRMEE d'abord, EN_ATTENTE ensuite, ANNULEE a la fin
        const ordre: Record<string, number> = { 'CONFIRMEE': 0, 'EN_ATTENTE': 1, 'ANNULEE': 2 };
        this.inscriptions = list.sort((a, b) => ordre[a.statut] - ordre[b.statut]);
        this.loading = false;
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.loading = false;
      }
    });
  }

  annuler(insc: InscriptionResponse): void {
    if (!confirm('Annuler cette inscription ? Cette action est irreversible.')) return;

    this.annulationEnCours = insc.id;

    this.inscriptionService.annuler(insc.id).subscribe({
      next: () => {
        // Mise a jour locale sans recharger toute la liste
        // Le backend a publie kafka inscription.annulee
        // Ferdaouss (service-action) va liberer la place
        // Le prochain EN_ATTENTE sera promu CONFIRMEE automatiquement
        const idx = this.inscriptions.findIndex(i => i.id === insc.id);
        if (idx !== -1) {
          this.inscriptions[idx] = { ...this.inscriptions[idx], statut: 'ANNULEE' };
        }
        this.annulationEnCours = null;
      },
      error: (err: Error) => {
        alert(err.message);
        this.annulationEnCours = null;
      }
    });
  }

  // Helpers affichage
  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'CONFIRMEE':  'Confirmee',
      'EN_ATTENTE': 'En attente',
      'ANNULEE':    'Annulee'
    };
    return labels[statut] ?? statut;
  }

  get actives(): InscriptionResponse[] {
    return this.inscriptions.filter(i => i.statut !== 'ANNULEE');
  }

  get annulees(): InscriptionResponse[] {
    return this.inscriptions.filter(i => i.statut === 'ANNULEE');
  }

  get totalPoints(): number {
    return this.inscriptions
      .filter(i => i.statut === 'CONFIRMEE')
      .reduce((sum, i) => sum + i.pointsAction, 0);
  }
}
