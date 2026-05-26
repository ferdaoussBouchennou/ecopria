import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InscriptionService } from '../../inscription.service';
import { DevContextService } from '../../../../core/services/dev-context.service';
import { PresenceService } from '../../../presence/presence.service';
import { InscriptionResponse } from '../../../../core/models/inscription.model';
import { ActionDTO } from '../../models/inscription.model';

interface InscriptionCard extends InscriptionResponse {
  actionTitre?: string;
  qrCode?: string;
}

@Component({
  selector: 'app-mes-inscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mes-inscriptions.component.html',
  styleUrls: ['./mes-inscriptions.component.css']
})
export class MesInscriptionsComponent implements OnInit {

  inscriptions: InscriptionCard[] = [];
  loading = true;
  erreurMessage = '';
  annulationEnCours: number | null = null;

  constructor(
    private inscriptionService: InscriptionService,
    private presenceService: PresenceService,
    private devContext: DevContextService
  ) {}

  private get userId(): number {
    return this.devContext.getParticipantUserId();
  }

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
        this.inscriptions = list
          .sort((a, b) => ordre[a.statut] - ordre[b.statut])
          .map((i) => ({ ...i }));
        this.loading = false;
        this.enrichirCartes();
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.loading = false;
      }
    });
  }

  private enrichirCartes(): void {
    this.inscriptions.forEach((insc, idx) => {
      this.inscriptionService.getAction(insc.actionId).subscribe({
        next: (action: ActionDTO) => {
          this.inscriptions[idx] = { ...this.inscriptions[idx], actionTitre: action.titre };
        }
      });
      if (insc.statut === 'CONFIRMEE') {
        this.presenceService.getQrCodeParAction(insc.actionId).subscribe({
          next: (qr) => {
            this.inscriptions[idx] = { ...this.inscriptions[idx], qrCode: qr.qrCode };
          }
        });
      }
    });
  }

  annuler(insc: InscriptionCard): void {
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

  get actives(): InscriptionCard[] {
    return this.inscriptions.filter(i => i.statut !== 'ANNULEE');
  }

  get annulees(): InscriptionCard[] {
    return this.inscriptions.filter(i => i.statut === 'ANNULEE');
  }

  get totalPoints(): number {
    return this.inscriptions
      .filter(i => i.statut === 'CONFIRMEE')
      .reduce((sum, i) => sum + i.pointsAction, 0);
  }
}
