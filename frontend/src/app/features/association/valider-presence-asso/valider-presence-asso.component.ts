import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { ParticipantsService } from '../services/participants.service';
import { Participant } from '../models/participant.model';

@Component({
  selector: 'app-valider-presence-asso',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './valider-presence-asso.component.html',
  styleUrl: './valider-presence-asso.component.scss',
})
export class ValiderPresenceAssoComponent implements OnInit {
  actionId!: number;
  actionTitle = '';
  pinCode: string | null = null;
  participants: Participant[] = [];
  selectedUserId: number | null = null;
  loading = true;
  validating = false;
  message = '';
  isError = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private associationService: AssociationService,
    private participantsService: ParticipantsService
  ) {}

  ngOnInit(): void {
    this.actionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.associationService.getAction(this.actionId).subscribe({
      next: (action) => {
        this.actionTitle = action.title;
        if ((action.registeredCount ?? 0) > 0) {
          this.associationService.getQRCode(this.actionId).subscribe({
            next: (qr) => (this.pinCode = qr.pinCode),
            error: () => (this.pinCode = null),
          });
        }
      },
      error: () => (this.error = 'Action introuvable'),
    });

    this.participantsService.getParticipants(this.actionId).subscribe({
      next: (list) => {
        this.participants = list.filter(
          (p) => p.statut === 'CONFIRMEE' && !p.presenceValidee
        );
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les participants';
        this.loading = false;
      },
    });
  }

  get candidates(): Participant[] {
    return this.participants;
  }

  valider(): void {
    if (!this.pinCode || this.selectedUserId == null || this.validating) {
      return;
    }
    this.validating = true;
    this.message = '';
    this.isError = false;

    this.associationService
      .validerPresenceParPin(this.pinCode, this.selectedUserId)
      .subscribe({
        next: () => {
          this.message = 'Présence validée avec succès.';
          this.isError = false;
          this.validating = false;
          this.selectedUserId = null;
          this.load();
        },
        error: (err) => {
          this.message =
            err?.error?.erreur || err?.message || 'Validation impossible';
          this.isError = true;
          this.validating = false;
        },
      });
  }

  labelParticipant(p: Participant): string {
    return `${p.firstName} ${p.lastName} (#${p.userId})`;
  }

  goBack(): void {
    void this.router.navigate(['/association/action', this.actionId, 'participants']);
  }
}
