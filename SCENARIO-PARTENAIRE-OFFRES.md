# 🏪 SCÉNARIO PARTENAIRE: Gestion des Offres

## 🎯 Objectif

Permettre aux partenaires de:
1. Créer et gérer leurs offres
2. Voir les offres actives sur leur page publique
3. Scanner et valider les coupons des citoyens

---

## 📋 FLUX COMPLET CÔTÉ PARTENAIRE

### **ÉTAPE 1: Le partenaire crée une offre** 📝

**Page:** `/partenaire/offres/nouvelle`

**Composant:** `CreerOffreComponent`

**Backend:**
- `POST /api/partenaire/recompenses`
- Créé l'offre dans la base de données
- Associe l'offre au partenaire connecté

**Informations requises:**
- Titre de l'offre
- Description
- Image
- Points nécessaires
- Type (STOCK, REDUCTION, SERVICE, EXPERIENCE)
- Stock (si applicable)
- Réduction % (si applicable)
- Date d'expiration (optionnelle)
- Boîte mystère (optionnelle)

---

### **ÉTAPE 2: L'offre apparaît sur la page publique du partenaire** 🌐

**Page publique:** `/partenaires/:userId`

**Composant:** `ProfilPartenairePublicComponent`

**Backend:**
- `GET /api/recompenses/public/partenaire/:userId/offres`
- Retourne UNIQUEMENT les offres de CE partenaire
- Filtrées par `isActive=true` et `isAvailable=true`

**Ce que les citoyens voient:**
- Profil du partenaire
- **Liste des offres du partenaire** (pas toutes les offres!)
- Image, titre, points, description de chaque offre

---

###  **ÉTAPE 3: Le citoyen échange et obtient un coupon** 🎁

**Ce qui se passe côté backend:**
1. Citoyen échange ses points
2. Backend génère un coupon avec code unique (ex: `ECO-A1B2-C3D4`)
3. Coupon sauvegardé avec statut `DISTRIBUE`
4. Citoyen reçoit le code

---

### **ÉTAPE 4: Le citoyen vient au magasin avec son coupon** 🏪

**Lieu:** Magasin/Restaurant physique du partenaire

Le citoyen montre:
- Son **code coupon** (texte)
- OU son **QR code**

---

### **ÉTAPE 5: Le partenaire scanne/valide le coupon** ✅

**Page:** `/partenaire/scanner`

**Composant:** `ScannerCouponComponent`

**Actions du partenaire:**

1. **Scanner le QR code**
   - Utilise la caméra du téléphone/tablette
   - Lit automatiquement le code

2. **OU entrer le code manuellement**
   - Tape: `ECO-A1B2-C3D4`
   - Clique sur "Valider"

3. **Backend valide:**
   - `POST /api/partenaire/coupons/valider`
   - Body: `{"code": "ECO-A1B2-C3D4"}`
   - Header: `X-User-Id: [partenaire_id]`

**Vérifications backend:**
- ✅ Le coupon existe
- ✅ Le coupon appartient à CE partenaire
- ✅ Le coupon n'est pas déjà utilisé (statut != UTILISE)
- ✅ Le coupon n'est pas expiré

**Si tout est OK:**
- Statut du coupon → `UTILISE`
- Date de validation enregistrée
- **Commission calculée** et enregistrée pour le partenaire
- Notification Kafka envoyée

**Résultat:**
- ✅ Message: "Coupon validé avec succès!"
- Le citoyen bénéficie de son offre
- Le partenaire voit la commission dans `/partenaire/commissions`

---

## 📡 API BACKEND UTILISÉES (CÔTÉ PARTENAIRE)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/partenaire/recompenses` | Créer une offre |
| GET | `/api/partenaire/recompenses` | Liste des offres du partenaire |
| PUT | `/api/partenaire/recompenses/:id` | Modifier une offre |
| DELETE | `/api/partenaire/recompenses/:id` | Désactiver une offre |
| GET | `/api/recompenses/public/partenaire/:userId/offres` | Offres publiques filtrées |
| POST | `/api/partenaire/coupons/valider` | **Valider un coupon** |
| GET | `/api/partenaire/commissions` | Voir les commissions |

---

## 🗂️ PAGES PARTENAIRE EXISTANTES

| Page | Route | Composant | Description |
|------|-------|-----------|-------------|
| Dashboard | `/partenaire/dashboard` | `DashboardPartenaireComponent` | Vue d'ensemble |
| Mes Offres | `/partenaire/offres` | `MesOffresComponent` | Liste des offres |
| Créer Offre | `/partenaire/offres/nouvelle` | `CreerOffreComponent` | Formulaire création |
| Modifier Offre | `/partenaire/offres/modifier/:id` | `CreerOffreComponent` | Formulaire modification |
| **Scanner** | `/partenaire/scanner` | `ScannerCouponComponent` | **Valider coupons** |
| Avis | `/partenaire/avis` | `AvisClientsComponent` | Gestion avis |
| Visibilité | `/partenaire/visibilite` | `VisibiliteComponent` | Statistiques |
| Commissions | `/partenaire/commissions` | `CommissionsComponent` | Revenus |
| Profil | `/partenaire/profil` | `ProfilPublicComponent` | Modifier profil |

---

## ✅ CE QUI ÉTAIT DÉJÀ IMPLÉMENTÉ

### Pages partenaires:
- ✅ Dashboard
- ✅ Créer/Modifier offres
- ✅ Liste des offres
- ✅ Scanner coupon
- ✅ Gestion avis
- ✅ Visibilité/Stats
- ✅ Commissions
- ✅ Profil

### Backend:
- ✅ Tous les endpoints partenaires
- ✅ Validation de coupons
- ✅ Calcul des commissions
- ✅ Filtrage des offres par partenaire

---

## 🔧 CE QUI A ÉTÉ CORRIGÉ/AMÉLIORÉ

### 1. Filtrage des offres par partenaire

**Problème:** Chaque page partenaire publique affichait TOUTES les offres de TOUS les partenaires

**Solution:** 
- Backend avait déjà l'endpoint `GET /api/recompenses/public/partenaire/:userId/offres`
- Frontend modifié pour utiliser cet endpoint
- Maintenant chaque partenaire affiche UNIQUEMENT ses offres

**Fichier modifié:**
```
frontend/src/app/features/recompense/profil-partenaire-public/
└── profil-partenaire-public.component.ts
```

**Changement:**
```typescript
// AVANT (récupérait toutes les offres)
this.recompenseService.getCatalogue().subscribe(...)

// APRÈS (récupère uniquement les offres de CE partenaire)
this.recompenseService.getOffresByPartenaire(userId).subscribe(...)
```

---

## 🚀 COMMENT TESTER LE SCÉNARIO PARTENAIRE

### 1. Créer une offre

```
1. Aller sur http://localhost:4200/partenaire/offres/nouvelle
2. Remplir le formulaire
3. Sauvegarder
```

### 2. Vérifier que l'offre apparaît sur la page publique

```
1. Aller sur http://localhost:4200/partenaires/101
   (remplacer 101 par l'ID du partenaire)
2. Vérifier que SEULES les offres de CE partenaire s'affichent
3. Pas d'offres des autres partenaires
```

### 3. Simuler un citoyen qui échange

```
1. Via Postman ou autre outil:
   POST http://localhost:9093/api/recompenses/echanger
   Header: X-User-Id: 1
   Body: {"recompenseId": 12}
   
2. Backend génère un coupon avec code
3. Noter le code retourné (ex: ECO-A1B2-C3D4)
```

### 4. Valider le coupon en tant que partenaire

```
1. Aller sur http://localhost:4200/partenaire/scanner
2. Entrer le code: ECO-A1B2-C3D4
3. Cliquer sur "Valider"
4. Voir le message de succès
```

### 5. Vérifier la commission

```
1. Aller sur http://localhost:4200/partenaire/commissions
2. Voir la commission calculée pour ce coupon
```

---

## 📊 DONNÉES DE TEST

### Partenaires dans la base (data-demo.sql):

| ID | Nom | userId | Catégorie |
|----|-----|--------|-----------|
| 1 | Café Botanique | 101 | Restaurant |
| 2 | Zara Maroc | 102 | Mode |
| 3 | Le Jardin Secret | 103 | Loisirs |
| 4 | Carrefour Bio | 104 | Alimentation |
| 5 | Vélo Vert Maroc | 105 | Sport |
| 6 | Spa Nature & Sens | 106 | Bien-être |
| 7 | Librairie Papier Recyclé | 107 | Culture |

### Offres existantes:

- **Café Botanique (userId=101):** 3 offres restaurant
- **Zara (userId=102):** 2 offres mode
- **Le Jardin Secret (userId=103):** 2 offres loisirs
- Etc.

---

## ✅ RÉSULTAT FINAL

### Ce qui fonctionne maintenant:

1. ✅ Partenaire crée une offre
2. ✅ Offre apparaît sur SA page publique uniquement
3. ✅ Citoyen voit l'offre et peut l'échanger
4. ✅ Citoyen obtient un coupon
5. ✅ Partenaire scanne/valide le coupon
6. ✅ Commission calculée automatiquement
7. ✅ Statistiques mises à jour

### Problème résolu:

❌ **AVANT:** Toutes les offres de tous les partenaires s'affichaient sur chaque page partenaire

✅ **APRÈS:** Chaque partenaire affiche uniquement SES offres sur sa page publique

---

## 🎯 CONCLUSION

Le scénario côté PARTENAIRE est **complet et fonctionnel**:

- Les partenaires peuvent créer et gérer leurs offres
- Chaque partenaire a sa page publique avec UNIQUEMENT ses offres
- Les partenaires peuvent scanner et valider les coupons
- Les commissions sont calculées automatiquement

**Pas de modification côté espace utilisateur/citoyen nécessaire!**

---

**Date:** 03 Juin 2026
**Statut:** ✅ Fonctionnel
**Scope:** Partenaire uniquement
