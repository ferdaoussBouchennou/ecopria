import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { InscriptionService } from '../../services/inscription.service';
import { ActionDTO, InscriptionResponse } from '../../models/inscription.model';

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

  // TODO: remplacer par votre AuthService quand l'auth sera branchee
  private readonly userId = 1;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private inscriptionService: InscriptionService
  ) {}

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
      accompagnants: [0,  [Validators.required, Validators.min(0),  Validators.max(10)]]
    });

    // Charge infos de l'action pour le recapitulatif
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
      // Affiche les erreurs sur tous les champs
      this.form.markAllAsTouched();
      return;
    }

    this.statut = 'submitting';
    this.erreurMessage = '';

    // Envoie uniquement userId + actionId au backend
    // Le backend gere lui-meme le qrCode, les points, le statut
    this.inscriptionService.inscrire({
      userId:   this.userId,
      actionId: this.actionId
    }).subscribe({
      next: (res: InscriptionResponse) => {
        this.inscription = res;
        // CONFIRMEE si places dispo, EN_ATTENTE si complet (gere par ActionPlacesConsumer)
        this.statut = res.statut === 'EN_ATTENTE' ? 'en_attente' : 'confirmee';
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
    this.form.reset({ accompagnants: 0 });
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

  get actionDate(): string {
    if (!this.action) return '';
    return new Date(this.action.dateAction).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get accompagnantsOptions(): number[] {
    return [0, 1, 2, 3, 4, 5];
  }
}
