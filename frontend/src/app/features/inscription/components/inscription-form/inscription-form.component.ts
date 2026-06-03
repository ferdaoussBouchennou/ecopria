import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { InscriptionService } from '../../inscription.service';
import { DevContextService } from '../../../../core/services/dev-context.service';
import { InscriptionResponse } from '../../../../core/models/inscription.model';
import { ActionDTO } from '../../models/inscription.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Les 6 etats possibles de la page
type PageStatut =
  | 'loading_action'  // chargement des infos action depuis service-action
  | 'idle'            // formulaire affiche, pret a remplir
  | 'submitting'      // envoi en cours vers service-inscription
  | 'confirmee'       // backend a retourne statut=CONFIRMEE
  | 'en_attente'      // backend a retourne statut=EN_ATTENTE (liste d'attente)
  | 'erreur';         // erreur reseau ou serveur

@Component({
  selector: 'app-inscription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inscription-form.component.html',
  styleUrls: ['./inscription-form.component.css']
})
export class InscriptionFormComponent implements OnInit {

  action: ActionDTO | null = null;
  actionId!: number;
  inscription: InscriptionResponse | null = null;
  erreurMessage = '';
  statut: PageStatut = 'loading_action';
  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private inscriptionService: InscriptionService,
    private devContext: DevContextService,
    private http: HttpClient
  ) {}

  private get userId(): number {
    return this.devContext.getParticipantUserId();
  }

  ngOnInit(): void {
    // Recupere l'actionId depuis l'URL : /inscription/42
    this.actionId = Number(this.route.snapshot.paramMap.get('actionId'));

    // Initialise le formulaire (champs de la maquette)
    this.form = this.fb.group({
      prenom:        ['', [Validators.required, Validators.minLength(2)]],
      nom:           ['', [Validators.required, Validators.minLength(2)]],
      email:         ['', [Validators.required, Validators.email]],
      telephone:     ['', [Validators.required, Validators.pattern(/^[0-9+\s]{8,15}$/)]],
      age:           ['', [Validators.required, Validators.min(16), Validators.max(99)]],
      motivation:    [''],
      conditions:    [''],
      rulesAccepted: [false, Validators.requiredTrue],
      imageRights:   [false],
      newsletter:    [false]
    });

    // Charge infos de l'action pour le recapitulatif
    this.chargerAction();

    // Pre-remplir le profil
    this.http.get<any>(`${environment.userApi}/${this.userId}/profile`).subscribe({
      next: (profile) => {
        if (profile) {
          this.form.patchValue({
            prenom: profile.firstName || '',
            nom: profile.lastName || '',
            email: profile.email || '',
            telephone: profile.phone || ''
          });
        }
      },
      error: (err) => console.error('Erreur chargement profil', err)
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
      // Affiche les erreurs sur tous les champs
      this.form.markAllAsTouched();
      return;
    }

    this.statut = 'submitting';
    this.erreurMessage = '';

    const formData = this.form.value;
    const updateProfileReq = {
      firstName: formData.prenom,
      lastName: formData.nom,
      email: formData.email,
      phone: formData.telephone,
      auth_id: this.userId
    };

    // Mettre à jour le profil d'abord, puis s'inscrire
    this.http.put(`${environment.userApi}/${this.userId}/profile`, updateProfileReq)
      .pipe(
        catchError((err) => {
          console.error('Erreur MAJ profil, on continue l\'inscription', err);
          return of(null);
        }),
        switchMap(() => {
          return this.inscriptionService.inscrire({
            userId:   this.userId,
            actionId: this.actionId,
            accompagnants: 0,
            firstName: formData.prenom,
            lastName: formData.nom,
            email: formData.email,
            phone: formData.telephone,
            motivation: formData.motivation,
            conditions: formData.conditions,
            imageRights: formData.imageRights,
            newsletter: formData.newsletter
          });
        })
      )
      .subscribe({
        next: (res: InscriptionResponse) => {
          this.inscription = res;
          const queryParams: Record<string, string> = { inscriptionOk: '1' };
          if (res.statut === 'EN_ATTENTE') {
            queryParams['listeAttente'] = '1';
          } else {
            queryParams['emailSent'] = '1';
          }
          void this.router.navigate(['/espace/actions'], { queryParams });
        },
        error: (err: Error) => {
          this.erreurMessage = err.message;
          this.statut = 'erreur';
        }
      });
  }

  recommencer(): void {
    this.statut = 'idle';
    this.erreurMessage = '';
    this.form.reset();
  }

  // Verifie si un champ a une erreur specifique (apres avoir ete touche)
  hasError(field: string, type: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(type));
  }

  // Verifie si un champ est invalide (pour la bordure rouge)
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get placesRestantes(): number {
    return this.action?.placesDisponibles ?? 0;
  }

  get lieuComplet(): string {
    if (!this.action?.lieu && !this.action?.ville) return '';
    const parts = [this.action.lieu, this.action.ville].filter(Boolean);
    return parts.join(', ');
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
