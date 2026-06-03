# 🔄 Diagramme de Flux - Système d'Échange de Points

## 📊 Flux Complet (Après Corrections)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR VISITE LE SITE                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Navigation: /partenaires  │
                    │  → /partenaire/:userId     │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │   ngOnInit() s'exécute     │
                    └───────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
                ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │ Charger profil       │               │ checkUserAuth()      │
    │ partenaire           │               │                      │
    └─────────────────────┘               └─────────────────────┘
                │                                       │
                ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │ Charger les offres   │               │ localStorage userId? │
    │ du partenaire        │               └─────────────────────┘
    └─────────────────────┘                           │
                                        ┌─────────────┴──────────────┐
                                        │                            │
                                    NON │                            │ OUI
                                        ▼                            ▼
                            ┌─────────────────────┐    ┌──────────────────────┐
                            │ isUserConnected     │    │ isUserConnected      │
                            │ = false             │    │ = true               │
                            │                     │    │                      │
                            │ Afficher:           │    │ loadUserPoints()     │
                            │ [Bannière Bleue]    │    │      ↓               │
                            │ "Connectez-vous"    │    │ getPoints(userId)    │
                            └─────────────────────┘    │      ↓               │
                                        │              │ soldePoints = X      │
                                        │              └──────────────────────┘
                                        │                          │
                                        └──────────┬───────────────┘
                                                   ▼
                                    ┌──────────────────────────┐
                                    │  AFFICHAGE DE LA PAGE     │
                                    └──────────────────────────┘
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        │                          │                          │
                        ▼                          ▼                          ▼
        ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
        │ CAS 1:                │  │ CAS 2:                │  │ CAS 3:                │
        │ NON CONNECTÉ          │  │ CONNECTÉ              │  │ CONNECTÉ              │
        │                       │  │ POINTS INSUFFISANTS   │  │ POINTS SUFFISANTS     │
        │ [Bannière Bleue]      │  │                       │  │                       │
        │ "Connectez-vous"      │  │ [Carte Verte]         │  │ [Carte Verte]         │
        │                       │  │ "50 points"           │  │ "500 points"          │
        │ Boutons:              │  │                       │  │                       │
        │ [  Échanger  ] ❌     │  │ Boutons:              │  │ Boutons:              │
        │ (disabled, gris)      │  │ [Manque 50 pts] ❌    │  │ [  Échanger  ] ✅     │
        │                       │  │ (disabled, rouge)     │  │ (enabled, vert)       │
        └───────────────────────┘  └───────────────────────┘  └───────────────────────┘
                    │                          │                          │
                    │ Clic                     │ Clic                     │ Clic
                    ▼                          ▼                          ▼
        ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
        │ echangerOffre()       │  │ echangerOffre()       │  │ echangerOffre()       │
        └───────────────────────┘  └───────────────────────┘  └───────────────────────┘
                    │                          │                          │
                    ▼                          ▼                          ▼
        ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
        │ !isUserConnected?     │  │ soldePoints < requis? │  │ Confirmation:         │
        │ → Alert + Redirect    │  │ → Alert détaillée     │  │ "Échanger 100 pts?"   │
        │   /connexion          │  │ → Return (stop)       │  │ "Solde: 500 → 400"    │
        │ → Return (stop)       │  │                       │  └───────────────────────┘
        └───────────────────────┘  └───────────────────────┘              │
                                                                         OUI │
                                                                            ▼
                                                              ┌─────────────────────────┐
                                                              │ POST /api/recompenses/   │
                                                              │      echanger            │
                                                              │ { recompenseId: X }      │
                                                              │ Header: X-User-Id        │
                                                              └─────────────────────────┘
                                                                            │
                                                    ┌───────────────────────┴───────────────────────┐
                                                    │                                               │
                                                    ▼                                               ▼
                                        ┌─────────────────────────┐                   ┌──────────────────────────┐
                                        │ BACKEND VALIDATION       │                   │ SUCCESS                  │
                                        │                          │                   │                          │
                                        │ 1. Récompense existe?    │                   │ 1. Génère code coupon    │
                                        │ 2. Est disponible?       │                   │ 2. Décrémente stock      │
                                        │ 3. User a assez points?  │                   │ 3. Publie sur Kafka      │
                                        │    (via utilisateur-svc) │                   │ 4. Retourne coupon       │
                                        └─────────────────────────┘                   └──────────────────────────┘
                                                    │                                               │
                                                ERREUR                                              ▼
                                                    ▼                                   ┌──────────────────────────┐
                                        ┌─────────────────────────┐                   │ FRONTEND                 │
                                        │ Frontend:                │                   │                          │
                                        │ alert(error.message)     │                   │ 1. showSuccessModal=true │
                                        │                          │                   │ 2. Affiche code coupon   │
                                        │ "Points insuffisants"    │                   │ 3. loadUserPoints()      │
                                        │ "Récompense non dispo"   │                   │    → Recharge solde      │
                                        └─────────────────────────┘                   │ 4. loadOffres()          │
                                                                                        │    → MAJ stock           │
                                                                                        └──────────────────────────┘
                                                                                                    │
                                                                                                    ▼
                                                                                        ┌──────────────────────────┐
                                                                                        │ [MODAL SUCCESS]          │
                                                                                        │                          │
                                                                                        │ 🎉 Félicitations!        │
                                                                                        │                          │
                                                                                        │ Code: ABC-123-XYZ        │
                                                                                        │                          │
                                                                                        │ [Voir mes coupons]       │
                                                                                        │ [Continuer]              │
                                                                                        └──────────────────────────┘
```

---

## 🔐 Flux d'Authentification

```
                    ┌─────────────────────┐
                    │  Page de Connexion   │
                    │  /connexion          │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  POST /api/auth/     │
                    │  login               │
                    │  { email, password } │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Backend valide      │
                    │  credentials         │
                    └─────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                ERREUR                SUCCESS
                    │                    │
                    ▼                    ▼
        ┌─────────────────────┐  ┌──────────────────────┐
        │ Message d'erreur     │  │ Retourne:            │
        │ "Email ou mot de     │  │ - JWT token          │
        │  passe incorrect"    │  │ - userId             │
        └─────────────────────┘  │ - userRole           │
                                 └──────────────────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │ Frontend stocke:     │
                                 │ localStorage.setItem │
                                 │ ('userId', userId)   │
                                 │ ('token', token)     │
                                 └──────────────────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │ Redirection:         │
                                 │ returnUrl présent?   │
                                 │   → Oui: returnUrl   │
                                 │   → Non: /espace     │
                                 └──────────────────────┘
```

---

## 🎯 Validation des Points (3 Niveaux)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        NIVEAU 1: FRONTEND UI                              │
│  (Prévention visuelle - Désactive le bouton)                             │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    hasEnoughPoints(offre) → false
                                   │
                                   ▼
                    [btn-exchange disabled btn-insufficient]
                    "Manque X pts"
                                   │
                           User clique quand même
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEAU 2: FRONTEND JAVASCRIPT                          │
│  (Validation avant envoi - Empêche la requête)                           │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    if (soldePoints < pointsNecessaires) {
                        alert("Points insuffisants!");
                        return; // Stop ici
                    }
                                   │
                    Si contournement (DevTools)
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       NIVEAU 3: BACKEND API                               │
│  (Validation définitive - Source de vérité)                              │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    Integer solde = utilisateurClient.getPoints(userId);
                    if (solde < recompense.getPointsNecessaires()) {
                        throw new RuntimeException(
                            "Points insuffisants. Solde: " + solde +
                            " — Requis: " + recompense.getPointsNecessaires()
                        );
                    }
                                   │
                                   ▼
                            Échange autorisé ✅
```

---

## 💾 État de l'Application

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          COMPOSANTS D'ÉTAT                               │
└─────────────────────────────────────────────────────────────────────────┘

Frontend Component State:
┌───────────────────────────────────┐
│ ProfilPartenairePublicComponent   │
├───────────────────────────────────┤
│ profil: PartenaireProfil          │  ← Chargé via API
│ offres: RecompenseItemDto[]       │  ← Filtrées par partenaire
│ isUserConnected: boolean          │  ← localStorage → true/false
│ soldePoints: number               │  ← API UserService
│ loadingSolde: boolean             │  ← Spinner pendant chargement
│ echangeEnCours: number | null     │  ← Offre en cours d'échange
│ showSuccessModal: boolean         │  ← Afficher modal succès
│ couponGenere: CouponDto | null    │  ← Code coupon reçu
└───────────────────────────────────┘

LocalStorage (Navigateur):
┌───────────────────────────────────┐
│ userId: "42"                      │  ← Stocké après login
│ token: "eyJhbGc..."               │  ← JWT pour auth
│ userRole: "CITOYEN"               │  ← Rôle utilisateur
└───────────────────────────────────┘

Backend Database (MySQL):
┌───────────────────────────────────┐
│ db_utilisateur.utilisateur        │
│   - id: 42                        │
│   - totalPoints: 500              │  ← Source de vérité
└───────────────────────────────────┘
┌───────────────────────────────────┐
│ db_recompense.recompense          │
│   - id: 10                        │
│   - pointsNecessaires: 100        │
│   - stock: 5                      │
└───────────────────────────────────┘
┌───────────────────────────────────┐
│ db_recompense.coupon              │
│   - userId: 42                    │
│   - recompenseId: 10              │
│   - code: "ABC-123-XYZ"           │
│   - pointsUtilises: 100           │
│   - status: DISTRIBUE             │
└───────────────────────────────────┘
```

---

## 🔄 Flux Kafka (Événements Asynchrones)

```
                    Échange effectué avec succès
                                │
                                ▼
            ┌──────────────────────────────────────┐
            │ service-recompense                   │
            │ recompenseProducer.publish()         │
            │ RecompenseEchangeeEvent              │
            └──────────────────────────────────────┘
                                │
                                ▼
            ┌──────────────────────────────────────┐
            │        KAFKA TOPIC                    │
            │   "recompense-echangee"              │
            └──────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ service-utilisateur        │   │ service-notification       │
│ @KafkaListener            │   │ @KafkaListener            │
│                           │   │                           │
│ 1. Déduit les points      │   │ 1. Envoie email avec      │
│    totalPoints -= 100     │   │    code coupon            │
│ 2. Enregistre historique  │   │ 2. Notification push?     │
└───────────────────────────┘   └───────────────────────────┘
```

---

**Date**: 3 juin 2026  
**Version**: 1.0.0  
**Développeur**: Kiro AI Assistant
