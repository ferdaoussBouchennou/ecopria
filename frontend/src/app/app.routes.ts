import { Routes } from '@angular/router';
import { PageShellComponent } from './shared/components/page-shell/page-shell.component';
import { InscriptionFormComponent } from './features/inscription/components/inscription-form/inscription-form.component';
import { MesInscriptionsComponent } from './features/inscription/components/mes-inscriptions/mes-inscriptions.component';
import { ListeActionsComponent } from './features/action/liste-actions/liste-actions.component';
import { DetailActionComponent } from './features/action/detail-action/detail-action.component';

export const routes: Routes = [
  {
    path: '',
    component: PageShellComponent,
    children: [
      { path: '', redirectTo: 'actions', pathMatch: 'full' },
      { path: 'actions', component: ListeActionsComponent },
      { path: 'action/:id', component: DetailActionComponent },
      { path: 'inscription/:actionId', component: InscriptionFormComponent },
      { path: 'mes-inscriptions', component: MesInscriptionsComponent },
    ],
  },
  { path: '**', redirectTo: 'actions' },
];
