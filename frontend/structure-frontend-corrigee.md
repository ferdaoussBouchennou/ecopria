# Structure Frontend Angular — EcoPria
## Corrigée et complète selon la maquette + microservices

---

## Erreurs dans la proposition initiale

| Problème | Détail |
|---------|--------|
| ❌ `app.module.ts` | Le projet utilise **standalone components** (Angular 17+) — pas de NgModules |
| ❌ `utilisateur.module.ts`, `notification.module.ts`... | À supprimer — modules obsolètes avec standalone |
| ❌ `features/utilisateur/profil` | Page `profil` n'existe pas dans la maquette — c'est `/espace/parametres` |
| ❌ `features/utilisateur/mes-badges` | Pas une page séparée — affiché dans le dashboard `/espace` |
| ❌ `features/utilisateur/historique-points` | Pas une page séparée — affiché dans le dashboard `/espace` |
| ❌ `features/recompense/detail-recompense` | Pas dans la maquette — pas de page détail récompense |
| ❌ `features/recompense/scanner-coupon` | C'est le scan côté partenaire → `/partenaire/offres`, pas séparé |
| ❌ `core/models/utilisateur.model.ts` | À renommer `user.model.ts` (projet en anglais) |
| ❌ routes dans `app-routing` incomplets | `/espace/*`, `/asso-dash/*`, `/partenaire/*`, `/admin/*` mal organisés |
| ❌ `comment-ca-marche` absent | Page présente dans la maquette, non assignée |

---

```
/src
│
├── app/
│   │
│   ├── core/                              ← services + guards + interceptors partagés
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts            ← JWT : login, logout, isLoggedIn(), getRole()
│   │   │   └── error-handler.service.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── auth.guard.ts              ← bloque si non connecté
│   │   │   ├── association.guard.ts       ← bloque si rôle ≠ ASSOCIATION
│   │   │   ├── partenaire.guard.ts        ← bloque si rôle ≠ PARTENAIRE
│   │   │   └── admin.guard.ts             ← bloque si rôle ≠ ADMIN
│   │   │
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts         ← injecte Authorization: Bearer <token>
│   │   │   └── loading.interceptor.ts     ← active/désactive le spinner global
│   │   │
│   │   └── models/                        ← interfaces TypeScript (noms en anglais)
│   │       ├── user.model.ts              ← Profile, LeaderboardEntry, PointHistory,
│   │       │                                 UserBadge, Badge, NotificationPreferences
│   │       ├── notification.model.ts      ← AppNotification (type INFO/SUCCESS/ALERT)
│   │       ├── action.model.ts            ← Action, Category, ActionSource
│   │       ├── inscription.model.ts       ← Inscription, InscriptionStatus
│   │       ├── presence.model.ts          ← QrCode, PresenceStatus
│   │       ├── recompense.model.ts        ← Reward, Coupon, Partner
│   │       └── admin.model.ts             ← AccountValidation, Stats
│   │
│   ├── shared/                            ← composants réutilisables dans toute l'app
│   │   ├── components/
│   │   │   ├── navbar/
│   │   │   │   ├── navbar.component.ts    ← menu public + cloche notifs (Sanae)
│   │   │   │   └── navbar.component.html
│   │   │   ├── footer/
│   │   │   │   ├── footer.component.ts
│   │   │   │   └── footer.component.html
│   │   │   ├── spinner/
│   │   │   │   ├── spinner.component.ts   ← affiché pendant loading.interceptor
│   │   │   │   └── spinner.component.html
│   │   │   ├── page-shell/
│   │   │   │   ├── page-shell.component.ts    ← layout public (navbar + footer)
│   │   │   │   └── page-shell.component.html
│   │   │   └── dashboard-shell/
│   │   │       ├── dashboard-shell.component.ts   ← layout sidebar pour espace/admin/asso/partenaire
│   │   │       └── dashboard-shell.component.html ← reçoit @Input() nav, title, subtitle
│   │   │
│   │   ├── pipes/
│   │   │   ├── date-fr.pipe.ts            ← "24 mai 2025" en français
│   │   │   └── points-format.pipe.ts      ← 1200 → "1 200 pts"
│   │   │
│   │   └── directives/
│   │       └── highlight.directive.ts
│   │
│   │
│   ├── features/                          ← un dossier par domaine métier
│   │   │
│   │   │
│   │   ├── auth/                          ← HAFSA — service-auth (port 8084)
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   └── login.component.html   ← route : /connexion
│   │   │   ├── register/
│   │   │   │   ├── register.component.ts
│   │   │   │   └── register.component.html ← route : /inscription
│   │   │   ├── forgot-password/
│   │   │   │   ├── forgot-password.component.ts
│   │   │   │   └── forgot-password.component.html ← route : /reset
│   │   │   └── auth.service.ts            ← POST /api/auth/login, /register, /refresh
│   │   │
│   │   │
│   │   ├── admin/                         ← HAFSA — service-admin (port 8087)
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── dashboard.component.html  ← route : /admin
│   │   │   │                                    stats : utilisateurs, actions, points, commissions
│   │   │   ├── comptes/
│   │   │   │   ├── comptes.component.ts
│   │   │   │   └── comptes.component.html    ← route : /admin/comptes
│   │   │   │                                    valider/rejeter associations + partenaires
│   │   │   ├── moderation/
│   │   │   │   ├── moderation.component.ts
│   │   │   │   └── moderation.component.html ← route : /admin/moderation
│   │   │   │                                    actions signalées
│   │   │   ├── categories/
│   │   │   │   ├── categories.component.ts
│   │   │   │   └── categories.component.html ← route : /admin/categories
│   │   │   │                                    CRUD des 5 catégories + actions fixes
│   │   │   └── admin.service.ts              ← GET/PUT /api/admin/*
│   │   │
│   │   │
│   │   ├── utilisateur/                   ← SANAE — service-utilisateur (port 8081)
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── dashboard.component.html  ← route : /espace
│   │   │   │                                    stats (points, actions, badges, rang)
│   │   │   │                                    historique points (5 derniers)
│   │   │   │                                    badges obtenus
│   │   │   │                                    mini-classement top 5
│   │   │   │                                    actions à venir (appelle service-inscription)
│   │   │   │
│   │   │   ├── mes-actions/
│   │   │   │   ├── mes-actions.component.ts
│   │   │   │   └── mes-actions.component.html ← route : /espace/actions
│   │   │   │                                    appelle service-inscription (statuts)
│   │   │   │                                    appelle service-action (détails titre/ville/date)
│   │   │   │                                    sections : "À venir" + "Historique"
│   │   │   │
│   │   │   ├── mes-qrcodes/
│   │   │   │   ├── mes-qrcodes.component.ts
│   │   │   │   └── mes-qrcodes.component.html ← route : /espace/qr
│   │   │   │                                    appelle service-presence
│   │   │   │                                    affiche QR code + action associée
│   │   │   │                                    code unique, usage unique, expire le jour J
│   │   │   │
│   │   │   ├── mes-recompenses/
│   │   │   │   ├── mes-recompenses.component.ts
│   │   │   │   └── mes-recompenses.component.html ← route : /espace/recompenses
│   │   │   │                                         appelle service-recompense
│   │   │   │                                         affiche coupons : code + partenaire + expiration
│   │   │   │
│   │   │   ├── classement/
│   │   │   │   ├── classement.component.ts
│   │   │   │   └── classement.component.html ← route : /espace/classement
│   │   │   │                                    GET /api/users/leaderboard?userId=X
│   │   │   │                                    rang, nom, ville, points — ligne "vous" surlignée
│   │   │   │
│   │   │   ├── parametres/
│   │   │   │   ├── parametres.component.ts
│   │   │   │   └── parametres.component.html ← route : /espace/parametres
│   │   │   │                                    PUT /api/users/{id}/profile (prénom, nom, ville)
│   │   │   │                                    PUT /api/users/{id}/preferences
│   │   │   │                                    4 toggles : nearbyActions, reminders,
│   │   │   │                                                catalogNews, newsletter
│   │   │   │
│   │   │   └── user.service.ts               ← GET/PUT /api/users/*  (port 8081)
│   │   │
│   │   │
│   │   ├── notification/                  ← SANAE — service-notification (port 8085)
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.component.ts
│   │   │   │   └── notifications.component.html ← route : /notifications
│   │   │   │                                       liste toutes les notifs in-app
│   │   │   │                                       marquer lue / tout lire
│   │   │   │                                       icône selon type SUCCESS/INFO/ALERT
│   │   │   └── notification.service.ts       ← GET /api/notifications/{userId}
│   │   │                                        GET /api/notifications/{userId}/unread-count
│   │   │                                        PUT /api/notifications/{id}/read
│   │   │                                        PUT /api/notifications/{userId}/read-all
│   │   │                                        BehaviorSubject count$ pour la cloche navbar
│   │   │
│   │   │
│   │   ├── action/                        ← FERDAOUSS — service-action (port 8083)
│   │   │   ├── accueil/
│   │   │   │   ├── accueil.component.ts
│   │   │   │   └── accueil.component.html    ← route : /
│   │   │   │                                    hero section + 3 actions en avant
│   │   │   ├── liste-actions/
│   │   │   │   ├── liste-actions.component.ts
│   │   │   │   └── liste-actions.component.html ← route : /actions
│   │   │   │                                       filtres : catégorie, source, date
│   │   │   ├── detail-action/
│   │   │   │   ├── detail-action.component.ts
│   │   │   │   └── detail-action.component.html ← route : /action/:id
│   │   │   │                                       description + bouton "Participer"
│   │   │   ├── carte/
│   │   │   │   ├── carte.component.ts
│   │   │   │   └── carte.component.html         ← route : /carte
│   │   │   │                                       Leaflet + marqueurs par catégorie
│   │   │   ├── profil-association/
│   │   │   │   ├── profil-association.component.ts
│   │   │   │   └── profil-association.component.html ← route : /asso
│   │   │   │                                             page vitrine publique d'une asso
│   │   │   ├── comment-ca-marche/             ← ⚠️ PAGE LIBRE — à assigner
│   │   │   │   ├── comment-ca-marche.component.ts
│   │   │   │   └── comment-ca-marche.component.html ← route : /comment-ca-marche
│   │   │   │                                           page 100% statique
│   │   │   │                                           étapes : inscription → action → points → récompense
│   │   │   └── action.service.ts             ← GET /api/actions/*, /categories
│   │   │
│   │   │
│   │   ├── asso-dash/                     ← FERDAOUSS + HAJAR — service-action + inscription + présence
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── dashboard.component.html  ← route : /asso-dash
│   │   │   │                                    stats : actions à venir, inscrits, taux présence
│   │   │   ├── mes-actions/
│   │   │   │   ├── mes-actions.component.ts
│   │   │   │   └── mes-actions.component.html ← route : /asso-dash/actions
│   │   │   │                                    liste des actions créées par l'asso
│   │   │   ├── creer-action/
│   │   │   │   ├── creer-action.component.ts
│   │   │   │   └── creer-action.component.html ← route : /asso-dash/creer
│   │   │   │                                     formulaire : titre, catégorie, lieu, date, places, points
│   │   │   ├── participants/
│   │   │   │   ├── participants.component.ts
│   │   │   │   └── participants.component.html ← route : /asso-dash/participants
│   │   │   │                                     liste inscrits + statuts (Inscrit/Validé/Absent)
│   │   │   │                                     appelle service-inscription (HAJAR)
│   │   │   └── scan/
│   │   │       ├── scan.component.ts
│   │   │       └── scan.component.html         ← route : /asso-dash/scan
│   │   │                                          caméra + scan QR code participants
│   │   │                                          appelle service-presence (HAJAR)
│   │   │
│   │   │
│   │   ├── inscription/                   ← HAJAR — service-inscription (port 8084)
│   │   │   ├── participer/
│   │   │   │   ├── participer.component.ts
│   │   │   │   └── participer.component.html  ← route : /participer/:id
│   │   │   │                                     formulaire d'inscription à une action
│   │   │   │                                     POST /api/inscriptions
│   │   │   └── inscription.service.ts         ← GET /api/inscriptions/mes-actions?userId=X
│   │   │                                          POST /api/inscriptions
│   │   │                                          DELETE /api/inscriptions/{id}
│   │   │
│   │   │
│   │   ├── presence/                      ← HAJAR — service-presence (port 8085)
│   │   │   ├── validation/
│   │   │   │   ├── validation.component.ts
│   │   │   │   └── validation.component.html  ← utilisé dans /asso-dash/scan
│   │   │   └── presence.service.ts            ← GET /api/qrcodes/{userId}/{actionId}
│   │   │                                          POST /api/presence/valider
│   │   │
│   │   │
│   │   └── recompense/                    ← FERDAOUSS — service-recompense (port 8086)
│   │       ├── catalogue/
│   │       │   ├── catalogue.component.ts
│   │       │   └── catalogue.component.html   ← route : /recompenses
│   │       │                                     grille récompenses + points requis
│   │       │                                     bouton "Échanger" (vérifie solde via user.service)
│   │       │                                     POST /api/recompenses/echanger
│   │       ├── dashboard-partenaire/
│   │       │   ├── dashboard-partenaire.component.ts
│   │       │   └── dashboard-partenaire.component.html ← route : /partenaire
│   │       │                                              stats : coupons distribués/utilisés, commissions
│   │       ├── mes-offres/
│   │       │   ├── mes-offres.component.ts
│   │       │   └── mes-offres.component.html  ← route : /partenaire/offres
│   │       │                                     liste + créer une nouvelle offre
│   │       ├── commissions/
│   │       │   ├── commissions.component.ts
│   │       │   └── commissions.component.html ← route : /partenaire/commissions
│   │       │                                     montant à régler + historique
│   │       └── recompense.service.ts          ← GET /api/recompenses/catalogue
│   │                                              GET /api/recompenses/mes-coupons?userId=X
│   │                                              POST /api/recompenses/echanger
│   │                                              GET /api/recompenses/partenaire/{id}/stats
│   │
│   │
│   ├── app.routes.ts                      ← routes principales (standalone)
│   ├── app.config.ts                      ← provideRouter + provideHttpClient
│   ├── app.component.ts
│   └── app.component.html
│
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── categories/
│       ├── nettoyage.jpg
│       ├── reboisement.jpg
│       ├── sensibilisation.jpg
│       ├── recyclage.jpg
│       └── compostage.jpg
│
├── environments/
│   ├── environment.ts           ← apiUrl: 'http://localhost:8080' (API Gateway)
│   └── environment.prod.ts
│
├── index.html
├── main.ts
└── styles.scss
```

---

## app.routes.ts — routes complètes

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { associationGuard } from './core/guards/association.guard';
import { partenaireGuard } from './core/guards/partenaire.guard';

export const routes: Routes = [

  // ── Pages publiques ────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/action/accueil/accueil.component')
      .then(m => m.AccueilComponent)
  },
  {
    path: 'actions',
    loadComponent: () => import('./features/action/liste-actions/liste-actions.component')
      .then(m => m.ListeActionsComponent)
  },
  {
    path: 'action/:id',
    loadComponent: () => import('./features/action/detail-action/detail-action.component')
      .then(m => m.DetailActionComponent)
  },
  {
    path: 'carte',
    loadComponent: () => import('./features/action/carte/carte.component')
      .then(m => m.CarteComponent)
  },
  {
    path: 'asso',
    loadComponent: () => import('./features/action/profil-association/profil-association.component')
      .then(m => m.ProfilAssociationComponent)
  },
  {
    path: 'comment-ca-marche',
    loadComponent: () => import('./features/action/comment-ca-marche/comment-ca-marche.component')
      .then(m => m.CommentCaMarcheComponent)
  },
  {
    path: 'recompenses',
    loadComponent: () => import('./features/recompense/catalogue/catalogue.component')
      .then(m => m.CatalogueComponent)
  },

  // ── Auth ───────────────────────────────────────────────────────
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'inscription',
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'reset',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'participer/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inscription/participer/participer.component')
      .then(m => m.ParticiperComponent)
  },

  // ── Espace utilisateur ─────────────────────────────────────────
  {
    path: 'espace',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/utilisateur/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'actions',
        loadComponent: () => import('./features/utilisateur/mes-actions/mes-actions.component')
          .then(m => m.MesActionsComponent)
      },
      {
        path: 'qr',
        loadComponent: () => import('./features/utilisateur/mes-qrcodes/mes-qrcodes.component')
          .then(m => m.MesQrcodesComponent)
      },
      {
        path: 'recompenses',
        loadComponent: () => import('./features/utilisateur/mes-recompenses/mes-recompenses.component')
          .then(m => m.MesRecompensesComponent)
      },
      {
        path: 'classement',
        loadComponent: () => import('./features/utilisateur/classement/classement.component')
          .then(m => m.ClassementComponent)
      },
      {
        path: 'parametres',
        loadComponent: () => import('./features/utilisateur/parametres/parametres.component')
          .then(m => m.ParametresComponent)
      }
    ]
  },

  // ── Notifications ──────────────────────────────────────────────
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notification/notifications/notifications.component')
      .then(m => m.NotificationsComponent)
  },

  // ── Dashboard Admin ────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'comptes',
        loadComponent: () => import('./features/admin/comptes/comptes.component')
          .then(m => m.ComptesComponent)
      },
      {
        path: 'moderation',
        loadComponent: () => import('./features/admin/moderation/moderation.component')
          .then(m => m.ModerationComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/categories.component')
          .then(m => m.CategoriesComponent)
      }
    ]
  },

  // ── Dashboard Association ──────────────────────────────────────
  {
    path: 'asso-dash',
    canActivate: [associationGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/asso-dash/dashboard/dashboard.component')
          .then(m => m.AssoDashboardComponent)
      },
      {
        path: 'actions',
        loadComponent: () => import('./features/asso-dash/mes-actions/mes-actions.component')
          .then(m => m.AssoMesActionsComponent)
      },
      {
        path: 'creer',
        loadComponent: () => import('./features/asso-dash/creer-action/creer-action.component')
          .then(m => m.CreerActionComponent)
      },
      {
        path: 'participants',
        loadComponent: () => import('./features/asso-dash/participants/participants.component')
          .then(m => m.ParticipantsComponent)
      },
      {
        path: 'scan',
        loadComponent: () => import('./features/asso-dash/scan/scan.component')
          .then(m => m.ScanComponent)
      }
    ]
  },

  // ── Dashboard Partenaire ───────────────────────────────────────
  {
    path: 'partenaire',
    canActivate: [partenaireGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/recompense/dashboard-partenaire/dashboard-partenaire.component')
          .then(m => m.DashboardPartenaireComponent)
      },
      {
        path: 'offres',
        loadComponent: () => import('./features/recompense/mes-offres/mes-offres.component')
          .then(m => m.MesOffresComponent)
      },
      {
        path: 'commissions',
        loadComponent: () => import('./features/recompense/commissions/commissions.component')
          .then(m => m.CommissionsComponent)
      }
    ]
  },

  // ── Fallback ───────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
```

---

## app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, loadingInterceptor])
    )
  ]
};
```

---

## environments/environment.ts

```typescript
export const environment = {
  production: false,
  // Ports Docker externes par service
  userApi:         'http://localhost:8081/api',   // service-utilisateur
  notificationApi: 'http://localhost:8085/api',   // service-notification
  actionApi:       'http://localhost:8083/api',   // service-action
  inscriptionApi:  'http://localhost:8084/api',   // service-inscription
  presenceApi:     'http://localhost:8086/api',   // service-presence
  recompenseApi:   'http://localhost:8087/api',   // service-recompense
  adminApi:        'http://localhost:8088/api',   // service-admin
  authApi:         'http://localhost:8089/api',   // service-auth
};
```

---

## Résumé par membre

| Membre | Dossier(s) | Pages (routes) | Services appelés |
|--------|-----------|----------------|-----------------|
| 🟢 **Sanae** | `features/utilisateur` + `features/notification` | `/espace`, `/espace/actions`, `/espace/qr`, `/espace/recompenses`, `/espace/classement`, `/espace/parametres`, `/notifications` | service-utilisateur, service-notification, service-inscription (lecture), service-presence (lecture), service-recompense (lecture) |
| 🔵 **Hafsa** | `features/auth` + `features/admin` | `/connexion`, `/inscription`, `/reset`, `/admin`, `/admin/comptes`, `/admin/moderation`, `/admin/categories` | service-auth, service-admin |
| 🟠 **Ferdaouss** | `features/action` + `features/recompense` | `/`, `/actions`, `/action/:id`, `/carte`, `/asso`, `/comment-ca-marche`, `/recompenses`, `/asso-dash`, `/asso-dash/actions`, `/asso-dash/creer`, `/partenaire`, `/partenaire/offres`, `/partenaire/commissions` | service-action, service-recompense |
| 🟣 **Hajar** | `features/inscription` + `features/presence` + pages dans `asso-dash` | `/participer/:id`, `/asso-dash/participants`, `/asso-dash/scan` | service-inscription, service-presence |
