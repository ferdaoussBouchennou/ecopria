import { Routes } from '@angular/router';
import { PageShellComponent } from './shared/components/page-shell/page-shell.component';
import { InscriptionFormComponent } from './features/inscription/components/inscription-form/inscription-form.component';
import { MesInscriptionsComponent } from './features/inscription/components/mes-inscriptions/mes-inscriptions.component';
import { ListeActionsComponent } from './features/action/liste-actions/liste-actions.component';
import { DetailActionComponent } from './features/action/detail-action/detail-action.component';
import { CarteActionsComponent } from './features/action/carte-actions/carte-actions.component';
import { AssociationShellComponent } from './features/association/layout/association-shell.component';
import { MesActionsComponent } from './features/association/mes-actions/mes-actions.component';
import { ActionFormComponent } from './features/association/action-form/action-form.component';
import { DetailActionAssoComponent } from './features/association/detail-action-asso/detail-action-asso.component';
import { ParticipantsComponent } from './features/association/participants/participants.component';
import { ProfilComponent } from './features/association/profil/profil.component';
import { ListeParticipantsComponent } from './features/association/liste-participants/liste-participants.component';

import { DashboardComponent } from './features/association/dashboard/dashboard.component';
import { CalendrierComponent } from './features/association/calendrier/calendrier.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { VerifyResetCodeComponent } from './features/auth/verify-reset-code/verify-reset-code.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { AccueilComponent } from './features/accueil/accueil.component';


// Espace Partenaire
import { PartenaireShellComponent } from './features/recompense/partenaire-shell/partenaire-shell.component';
import { DashboardPartenaireComponent } from './features/recompense/dashboard-partenaire/dashboard-partenaire.component';
import { ProfilPublicComponent } from './features/recompense/profil-public/profil-public.component';
import { MesOffresComponent } from './features/recompense/mes-offres/mes-offres.component';
import { CreerOffreComponent } from './features/recompense/creer-offre/creer-offre.component';
import { ScannerCouponComponent } from './features/recompense/scanner-coupon/scanner-coupon.component';
import { AvisClientsComponent } from './features/recompense/avis-clients/avis-clients.component';
import { VisibiliteComponent } from './features/recompense/visibilite/visibilite.component';
import { CommissionsComponent } from './features/recompense/commissions/commissions.component';

export const routes: Routes = [
  // Routes publiques avec navbar/footer
  {
    path: '',
    component: PageShellComponent,
    children: [
      { path: '', component: AccueilComponent },
      { path: 'accueil', component: AccueilComponent },
      { path: 'actions', component: ListeActionsComponent },
      { path: 'carte', component: CarteActionsComponent },
      { path: 'action/:id', component: DetailActionComponent },
      { path: 'inscription/:actionId', component: InscriptionFormComponent },
      { path: 'mes-inscriptions', component: MesInscriptionsComponent },
      { path: 'creer-compte', component: RegisterComponent },
      { path: 'verifier-email', component: VerifyEmailComponent },
      { path: 'connexion', component: LoginComponent },
      { path: 'mot-de-passe-oublie', component: ForgotPasswordComponent },
      { path: 'reinitialiser-mot-de-passe/code', component: VerifyResetCodeComponent },
      { path: 'reinitialiser-mot-de-passe/nouveau', component: ResetPasswordComponent },
      { path: 'valider-presence/:actionId', loadComponent: () => import('./features/inscription/components/scan-participant/scan-participant.component').then(m => m.ScanParticipantComponent) },
    ],
  },
  
  // Routes association avec sidebar (sans navbar/footer)



  // ── Espace Partenaire ─────────────────────────────────────────
  {
    path: 'partenaire',
    component: PartenaireShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',             component: DashboardPartenaireComponent },
      { path: 'profil',                component: ProfilPublicComponent },
      { path: 'offres',                component: MesOffresComponent },
      { path: 'offres/nouvelle',       component: CreerOffreComponent },
      { path: 'offres/modifier/:id',   component: CreerOffreComponent },
      { path: 'scanner',               component: ScannerCouponComponent },
      { path: 'avis',                  component: AvisClientsComponent },
      { path: 'visibilite',            component: VisibiliteComponent },
      { path: 'commissions',           component: CommissionsComponent },
    ],
  },

  {
    path: 'association',
    component: AssociationShellComponent,
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
      { path: 'tableau-de-bord', component: DashboardComponent },
      { path: 'mes-actions', component: MesActionsComponent },
      { path: 'calendrier', component: CalendrierComponent },
      { path: 'creer', component: ActionFormComponent },
      { path: 'modifier/:id', component: ActionFormComponent },
      { path: 'action/:id', component: DetailActionAssoComponent },
      { path: 'action/:id/participants', component: ParticipantsComponent },
      { path: 'participants', component: ListeParticipantsComponent },
      { path: 'profil', component: ProfilComponent },
      // TODO: Ajouter les routes pour notifications
    ],
  },
  
  { path: '**', redirectTo: '' },
];
