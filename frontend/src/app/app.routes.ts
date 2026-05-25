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

export const routes: Routes = [
  // Routes publiques avec navbar/footer
  {
    path: '',
    component: PageShellComponent,
    children: [
      { path: '', redirectTo: 'actions', pathMatch: 'full' },
      { path: 'actions', component: ListeActionsComponent },
      { path: 'carte', component: CarteActionsComponent },
      { path: 'carte', component: CarteActionsComponent },
      { path: 'action/:id', component: DetailActionComponent },
      { path: 'inscription/:actionId', component: InscriptionFormComponent },
      { path: 'mes-inscriptions', component: MesInscriptionsComponent },
    ],
  },
  
  // Routes association avec sidebar (sans navbar/footer)
  {
    path: 'association',
    component: AssociationShellComponent,
    children: [
      { path: '', redirectTo: 'mes-actions', pathMatch: 'full' },
      { path: 'tableau-de-bord', component: MesActionsComponent },
      { path: 'mes-actions', component: MesActionsComponent },
      { path: 'creer', component: ActionFormComponent },
      { path: 'modifier/:id', component: ActionFormComponent },
      { path: 'action/:id', component: DetailActionAssoComponent },
      // TODO: Ajouter les routes pour participants et scanner
    ],
  },
  
  { path: '**', redirectTo: 'actions' },
];
