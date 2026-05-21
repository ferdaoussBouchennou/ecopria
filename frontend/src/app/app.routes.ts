import { Routes } from '@angular/router';
import { InscriptionFormComponent } from './features/inscription/components/inscription-form/inscription-form.component';
import { MesInscriptionsComponent } from './features/inscription/components/mes-inscriptions/mes-inscriptions.component';

export const routes: Routes = [
  { path: '', redirectTo: 'mes-inscriptions', pathMatch: 'full' },
  { path: 'inscription/:actionId', component: InscriptionFormComponent },
  { path: 'mes-inscriptions',      component: MesInscriptionsComponent },
];
