import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { InscriptionService } from '../inscription.service';
import { PresenceService } from '../../presence/presence.service';
import { ActionDTO } from '../models/inscription.model';
import { InscriptionResponse } from '../../../core/models/inscription.model';

type PageStatut =
  | 'loading_action'
  | 'idle'
  | 'submitting'
  | 'confirmee'
  | 'en_attente'
  | 'erreur';

@Component({
  selector: 'app-participer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './participer.component.html',
  styleUrls: ['./participer.component.css']
})
export class ParticiperComponent implements OnInit {

  action: ActionDTO | null = null;
  actionId!: number;
  inscription: InscriptionResponse | null = null;
  qrCode = '';
  erreurMessage = '';
  statut: PageStatut = 'loading_action';
  form!: FormGroup;

  private readonly userId = 1;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private inscriptionService: InscriptionService,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    const idParam =
      this.route.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('actionId');
    this.actionId = Number(idParam);

    this.form = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\s]{8,15}$/)]],
      age: ['', [Validators.required, Validators.min(16), Validators.max(99)]],
      accompagnants: [0, [Validators.required, Validators.min(0), Validators.max(10)]]
    });

    this.chargerAction();
  }

  private chargerAction(): void {
    this.statut = 'loading_action';
    this.inscriptionService.getAction(this.actionId).subscribe({
      next: (action: ActionDTO) => {
        this.action = action;
        this.statut = 'idle';
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.statut = 'erreur';
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.statut = 'submitting';
    this.erreurMessage = '';

    this.inscriptionService.inscrire({
      userId: this.userId,
      actionId: this.actionId
    }).subscribe({
      next: (res: InscriptionResponse) => {
        this.inscription = res;
        if (res.statut === 'CONFIRMEE') {
          this.chargerQrCode();
          this.statut = 'confirmee';
        } else {
          this.statut = 'en_attente';
        }
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.statut = 'erreur';
      }
    });
  }

  private chargerQrCode(): void {
    this.presenceService.getQrCodeParAction(this.actionId).subscribe({
      next: (res) => {
        this.qrCode = res.qrCode;
      },
      error: () => {
        this.qrCode = 'QR généré le jour J (Kafka / service-presence requis)';
      }
    });
  }

  recommencer(): void {
    this.statut = 'idle';
    this.erreurMessage = '';
    this.form.reset({ accompagnants: 0 });
  }

  hasError(field: string, type: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(type));
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get placesRestantes(): number {
    return this.action?.placesDisponibles ?? 0;
  }

  get lieuComplet(): string {
    if (!this.action?.lieu && !this.action?.ville) return '';
    return [this.action.lieu, this.action.ville].filter(Boolean).join(', ');
  }

  get actionDate(): string {
    if (!this.action?.dateAction) return '';
    return new Date(this.action.dateAction).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get accompagnantsOptions(): number[] {
    return [0, 1, 2, 3, 4, 5];
  }

  get isFixedAction(): boolean {
    return this.action?.isFixed ?? false;
  }
}
