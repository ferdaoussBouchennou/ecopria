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
import { DashboardComponent as AssociationDashboardComponent } from './features/association/dashboard/dashboard.component';
import { CalendrierComponent } from './features/association/calendrier/calendrier.component';
import { EspaceShellComponent } from './features/utilisateur/espace-shell/espace-shell.component';
import { DashboardComponent } from './features/utilisateur/dashboard/dashboard.component';
import { ActionsComponent } from './features/utilisateur/actions/actions.component';
import { LeaderboardComponent } from './features/utilisateur/leaderboard/leaderboard.component';
import { RecompensesComponent } from './features/utilisateur/recompenses/recompenses.component';
import { SettingsComponent } from './features/utilisateur/settings/settings.component';

export const routes: Routes = [
  // Routes publiques avec navbar/footer
  {
    path: '',
    component: PageShellComponent,
    children: [
      { path: '', redirectTo: 'actions', pathMatch: 'full' },
      { path: 'actions', component: ListeActionsComponent },
      { path: 'carte', component: CarteActionsComponent },
      { path: 'action/:id', component: DetailActionComponent },
      { path: 'inscription/:actionId', component: InscriptionFormComponent },
      { path: 'mes-inscriptions', component: MesInscriptionsComponent },
      { path: 'valider-presence/:actionId', loadComponent: () => import('./features/inscription/components/scan-participant/scan-participant.component').then(m => m.ScanParticipantComponent) },
    ],
  },
  
  // Routes association avec sidebar (sans navbar/footer)
  {
    path: 'association',
    component: AssociationShellComponent,
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
      { path: 'tableau-de-bord', component: AssociationDashboardComponent },
      { path: 'mes-actions', component: MesActionsComponent },
      { path: 'calendrier', component: CalendrierComponent },
      { path: 'creer', component: ActionFormComponent },
      { path: 'modifier/:id', component: ActionFormComponent },
      { path: 'action/:id', component: DetailActionAssoComponent },
      { path: 'action/:id/participants', component: ParticipantsComponent },
      { path: 'participants', component: ListeParticipantsComponent },
      { path: 'profil', component: ProfilComponent },
    ],
  },

  // Routes utilisateur/espace personnel
  {
    path: 'espace',
    component: EspaceShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'actions', component: ActionsComponent },
      { path: 'recompenses', component: RecompensesComponent },
      { path: 'classement', component: LeaderboardComponent },
      { path: 'parametres', component: SettingsComponent },
    ],
  },
  
  { path: '**', redirectTo: 'actions' },
];
