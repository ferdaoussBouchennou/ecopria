import { Routes } from '@angular/router';
import { PageShellComponent } from './shared/components/page-shell/page-shell.component';
import { InscriptionFormComponent } from './features/inscription/components/inscription-form/inscription-form.component';
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
import { AfficherQRComponent } from './features/association/afficher-qr/afficher-qr.component';
import { ValiderPresenceAssoComponent } from './features/association/valider-presence-asso/valider-presence-asso.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { CompteEnAttenteComponent } from './features/auth/compte-en-attente/compte-en-attente.component';
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
import { ProfilPartenairePublicComponent } from './features/recompense/profil-partenaire-public/profil-partenaire-public.component';
import { ListePartenairesComponent } from './features/recompense/liste-partenaires/liste-partenaires.component';
import { RecompensesPubliqueComponent } from './features/recompense/recompenses-publique/recompenses-publique.component';
import { DashboardComponent } from './features/utilisateur/dashboard/dashboard.component';
import { ActionsComponent } from './features/utilisateur/actions/actions.component';
import { LeaderboardComponent } from './features/utilisateur/leaderboard/leaderboard.component';
import { RecompensesComponent } from './features/utilisateur/recompenses/recompenses.component';
import { SettingsComponent } from './features/utilisateur/settings/settings.component';
import { ScannerPresenceComponent } from './features/utilisateur/scanner-presence/scanner-presence.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard, associationGuard, citizenGuard, partenaireGuard } from './core/guards/auth.guard';
import { AdminShellComponent } from './features/admin/admin-shell/admin-shell.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminComptesComponent } from './features/admin/comptes/admin-comptes.component';
import { AdminActionsFixesComponent } from './features/admin/actions-fixes/admin-actions-fixes.component';
import { AdminModerationComponent } from './features/admin/moderation/admin-moderation.component';
import { AdminCategoriesComponent } from './features/admin/categories/admin-categories.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminConfigurationsComponent } from './features/admin/configurations/admin-configurations.component';
import { AdminLogsComponent } from './features/admin/logs/admin-logs.component';

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
      { path: 'inscription/:actionId', component: InscriptionFormComponent, canActivate: [authGuard] },
      { path: 'mes-inscriptions', redirectTo: '/espace/actions', pathMatch: 'full' },
      { path: 'creer-compte', component: RegisterComponent },
      { path: 'verifier-email', component: VerifyEmailComponent },
      { path: 'connexion', component: LoginComponent },
      { path: 'compte-en-attente', component: CompteEnAttenteComponent },
      { path: 'mot-de-passe-oublie', component: ForgotPasswordComponent },
      { path: 'reinitialiser-mot-de-passe/code', component: VerifyResetCodeComponent },
      { path: 'reinitialiser-mot-de-passe/nouveau', component: ResetPasswordComponent },
      {
        path: 'valider-presence/:actionId',
        redirectTo: '/espace/scanner-presence/:actionId',
        pathMatch: 'full',
      },
      { path: 'recompenses', component: RecompensesPubliqueComponent },
      { path: 'partenaires', component: ListePartenairesComponent },
      { path: 'partenaires/:userId', component: ProfilPartenairePublicComponent },
      {
        path: 'espace',
        canActivate: [citizenGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'actions', component: ActionsComponent },
          { path: 'scanner-presence/:actionId', component: ScannerPresenceComponent },
          { path: 'scanner-presence', component: ScannerPresenceComponent },
          { path: 'recompenses', component: RecompensesComponent },
          { path: 'classement', component: LeaderboardComponent },
          { path: 'parametres', component: SettingsComponent },
        ],
      },
    ],
  },
  
  // Routes association avec sidebar (sans navbar/footer)



  // ── Espace Partenaire ─────────────────────────────────────────
  {
    path: 'partenaire',
    component: PartenaireShellComponent,
    canActivate: [partenaireGuard],
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
    canActivate: [associationGuard],
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
      { path: 'tableau-de-bord', component: AssociationDashboardComponent },
      { path: 'mes-actions', component: MesActionsComponent },
      { path: 'calendrier', component: CalendrierComponent },
      { path: 'creer', component: ActionFormComponent },
      { path: 'modifier/:id', component: ActionFormComponent },
      { path: 'action/:id', component: DetailActionAssoComponent },
      { path: 'action/:id/participants', component: ParticipantsComponent },
      { path: 'action/:id/valider-presence', component: ValiderPresenceAssoComponent },
      { path: 'action/:id/qr', component: AfficherQRComponent },
      { path: 'participants', component: ListeParticipantsComponent },
      { path: 'profil', component: ProfilComponent },
    ],
  },
  // ── Espace Admin ──────────────────────────────────────────────
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'comptes', component: AdminComptesComponent },
      { path: 'actions-fixes', component: AdminActionsFixesComponent },
      { path: 'moderation', component: AdminModerationComponent },
      { path: 'categories', component: AdminCategoriesComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'configurations', component: AdminConfigurationsComponent },
      { path: 'logs', component: AdminLogsComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
