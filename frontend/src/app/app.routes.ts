import { Routes } from '@angular/router';
import { PageShellComponent } from './shared/components/page-shell/page-shell.component';
import { InscriptionFormComponent } from './features/inscription/components/inscription-form/inscription-form.component';
import { MesInscriptionsComponent } from './features/inscription/components/mes-inscriptions/mes-inscriptions.component';
import { ListeActionsComponent } from './features/action/liste-actions/liste-actions.component';
import { DetailActionComponent } from './features/action/detail-action/detail-action.component';
import { CarteActionsComponent } from './features/action/carte-actions/carte-actions.component';


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
  // ── Routes publiques avec navbar/footer ─────────────────────
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
    ],
  },



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

  { path: '**', redirectTo: 'actions' },
];
