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
import { AuthService } from '../../../core/services/auth.service';
import { PresenceService } from '../../presence/presence.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
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

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private inscriptionService: InscriptionService,
    private presenceService: PresenceService,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

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
      ville: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(16), Validators.max(99)]]
    });

    this.chargerAction();
    this.chargerProfil();
  }

  private chargerProfil(): void {
    this.http.get<{ firstName?: string; lastName?: string; email?: string; phone?: string; city?: string }>(
      `${environment.userApi}/${this.userId}/profile`
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.form.patchValue({
            prenom: profile.firstName || '',
            nom: profile.lastName || '',
            email: profile.email || '',
            telephone: profile.phone || '',
            ville: profile.city || ''
          });
        }
      },
      error: () => { /* profil vide ou nouveau compte */ }
    });
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

    const formData = this.form.value;
    const profileUpdate = {
      firstName: formData.prenom,
      lastName: formData.nom,
      email: formData.email,
      phone: formData.telephone,
      city: formData.ville
    };

    this.http.put(`${environment.userApi}/${this.userId}/profile`, profileUpdate).pipe(
      catchError((err) => {
        console.error('Erreur MAJ profil, on continue l\'inscription', err);
        return of(null);
      }),
      switchMap(() => this.inscriptionService.inscrire({
        userId: this.userId,
        actionId: this.actionId,
        firstName: formData.prenom,
        lastName: formData.nom,
        email: formData.email,
        phone: formData.telephone,
        city: formData.ville,
        motivation: '',
        imageRights: false,
        newsletter: false
      }))
    ).subscribe({
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
        // Gérer spécifiquement l'erreur de doublon
        if (err.message.includes('déjà inscrit')) {
          this.erreurMessage = 'Vous êtes déjà inscrit à cette action. Consultez vos inscriptions pour voir les détails.';
        } else {
          this.erreurMessage = err.message || 'Une erreur est survenue lors de l\'inscription.';
        }
        this.statut = 'erreur';
        console.error('Erreur inscription:', err);
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
    this.form.reset();
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

  get isFixedAction(): boolean {
    return this.action?.isFixed ?? false;
  }
}
