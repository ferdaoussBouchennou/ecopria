import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/espace', pathMatch: 'full' },

  {
    path: 'espace',
    loadComponent: () => import('./espace/espace-shell/espace-shell.component').then(m => m.EspaceShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./espace/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'classement',
        loadComponent: () => import('./espace/leaderboard/leaderboard.component')
          .then(m => m.LeaderboardComponent)
      },
      {
        path: 'parametres',
        loadComponent: () => import('./espace/settings/settings.component')
          .then(m => m.SettingsComponent)
      }
    ]
  },

  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.component')
      .then(m => m.NotificationsComponent)
  },

  { path: '**', redirectTo: '/espace' }
];
