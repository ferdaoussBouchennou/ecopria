# 🧪 TEST COMPLET - ESPACE PARTENAIRE ECOPRIA

**Date:** 29 mai 2026  
**Status:** 🚀 PRÊT À TESTER  
**Durée estimée:** 30-45 minutes

---

## 📋 RÉSUMÉ EXÉCUTIF

Ce document guide vous à travers un test complet de l'espace partenaire avec:
- ✅ Vérification de l'infrastructure (MySQL, Kafka, API Gateway, Frontend)
- ✅ Création d'offres (STOCK, REDUCTION, SERVICE, EXPERIENCE)
- ✅ Modification d'offres
- ✅ Suppression d'offres
- ✅ Calcul de commission
- ✅ Scanner de coupon
- ✅ Vérification des données en base de données
- ✅ Vérification du dashboard

---

## 🚀 ÉTAPE 0: VÉRIFIER L'INFRASTRUCTURE

### 0.1 Vérifier que tous les services sont en cours d'exécution

```bash
# Vérifier les services Docker
docker compose ps

# Résultat attendu:
# mysql-recompense    Up    3311:3311
# kafka               Up    9092:9092
```

### 0.2 Vérifier les ports

```bash
# Vérifier les ports clés
netstat -ano | findstr "9093 8080 4200 3311 9092"

# Résultat attendu:
# 9093 - Service-recompense (Java)
# 8080 - API Gateway (Java)
# 4200 - Frontend (Angular)
# 3311 - MySQL
# 9092 - Kafka
```

### 0.3 Vérifier la connexion à MySQL

```bash
# Accéder à PhpMyAdmin
# URL: http://localhost:8888
# Utilisateur: root
# Mot de passe: root

# Vérifier que la base de données db_recompense existe
# Vérifier les tables: recompenses, commissions, partenaires
```

---

## 🎯 ÉTAPE 1: ACCÉDER AU DASHBOARD

### 1.1 Ouvrir le navigateur

```
URL: http://localhost:4200/partenaire/dashboard
```

### 1.2 Vérifier le chargement

- ✅ Page charge sans erreurs
- ✅ Hero section visible avec gradient vert
- ✅ 8 KPI cards affichées
- ✅ Section "Mes offres" visible
- ✅ Section "Échanges récents" visible

### 1.3 Vérifier les données initiales

**Statistiques attendues:**
```
Vues du profil public: 1842
Clics vers offres: 624
Coupons distribués: 0
Coupons utilisés: 0
Taux d'utilisation: 0%
Note moyenne: 4.7
Nombre d'avis: 3
Commissions à régler: 0 DH
Badge actuel: Bronze
```

### 1.4 Vérifier dans DevTools

1. Ouvrir DevTools (F12)
2. Aller à "Console"
3. Vérifier que userId est initialisé:
   ```javascript
   localStorage.getItem('userId')
   // Résultat: "1"
   ```

---

## ✅ ÉTAPE 2: TESTER LA CRÉATION D'OFFRE (TYPE STOCK)

### 2.1 Créer une offre via l'interface

1. Cliquer sur "Nouvelle offre" (bouton vert)
2. Remplir le formulaire:
   ```
   Titre:              "Café & pâtisserie maison"
   Description:        "Café frais et pâtisseries artisanales"
   Points:             100
   Type:               STOCK
   Stock:              150
   Valeur DH:          50
   Discount %:         20
   Date expiration:    31/12/2026
   ```
3. Cliquer sur "Créer"

### 2.2 Vérifier dans DevTools

1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ POST `/api/partenaire/offres`
   - ✅ Status: **201 Created**
   - ✅ Response contient l'offre

**Response attendue:**
```json
{
  "id": 1,
  "title": "Café & pâtisserie maison",
  "description": "Café frais et pâtisseries artisanales",
  "type": "STOCK",
  "stock": 150,
  "discountPercentage": 20,
  "valeurDh": 50,
  "isActive": true,
  "createdAt": "2026-05-29T..."
}
```

### 2.3 Vérifier en base de données

```sql
-- PhpMyAdmin: http://localhost:8888
-- Base: db_recompense
-- Table: recompenses

SELECT * FROM recompenses WHERE partenaire_id = 1 ORDER BY created_at DESC LIMIT 1;
```

**Résultat attendu:**
```
id: 1
partenaire_id: 1
title: "Café & pâtisserie maison"
type: "STOCK"
stock: 150
discount_percentage: 20
valeur_dh: 50
is_active: 1
created_at: 2026-05-29T...
```

### 2.4 Vérifier dans le dashboard

- ✅ Offre affichée dans "Mes offres"
- ✅ Nombre d'offres actives: 1
- ✅ Offre visible dans la liste

---

## ✏️ ÉTAPE 3: TESTER LA MODIFICATION D'OFFRE

### 3.1 Modifier l'offre via l'interface

1. Aller à "Mes offres"
2. Cliquer sur l'offre "Café & pâtisserie maison"
3. Modifier:
   ```
   Stock:              120 (au lieu de 150)
   Discount %:         25 (au lieu de 20)
   ```
4. Cliquer sur "Modifier"

### 3.2 Vérifier dans DevTools

1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ PUT `/api/partenaire/offres/1`
   - ✅ Status: **200 OK**

### 3.3 Vérifier en base de données

```sql
SELECT * FROM recompenses WHERE id = 1;
```

**Résultat attendu:**
```
stock: 120
discount_percentage: 25
updated_at: 2026-05-29T...
```

---

## 🗑️ ÉTAPE 4: TESTER LA SUPPRESSION D'OFFRE

### 4.1 Créer une deuxième offre

1. Cliquer sur "Nouvelle offre"
2. Remplir le formulaire:
   ```
   Titre:              "Tote bag en coton bio"
   Description:        "Sac réutilisable écologique"
   Points:             50
   Type:               STOCK
   Stock:              200
   Valeur DH:          30
   Discount %:         15
   ```
3. Cliquer sur "Créer"

### 4.2 Supprimer l'offre

1. Aller à "Mes offres"
2. Cliquer sur l'offre "Tote bag en coton bio"
3. Cliquer sur "Supprimer"
4. Confirmer la suppression

### 4.3 Vérifier dans DevTools

1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ DELETE `/api/partenaire/offres/2`
   - ✅ Status: **200 OK**

### 4.4 Vérifier en base de données

```sql
SELECT * FROM recompenses WHERE id = 2;
```

**Résultat attendu:**
```
is_active: 0
```

---

## 💰 ÉTAPE 5: TESTER LE CALCUL DE COMMISSION

### 5.1 Créer un coupon (simuler un échange)

**Utiliser Postman ou curl:**

```bash
curl -X POST http://localhost:8080/api/recompenses/echanger \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"recompenseId": 1}'
```

**Résultat attendu:**
```json
{
  "id": 1,
  "code": "ECO-2026-XXXXX",
  "status": "DISTRIBUE",
  "pointsUtilises": 100,
  "createdAt": "2026-05-29T..."
}
```

### 5.2 Valider le coupon (scanner)

```bash
curl -X POST http://localhost:8080/api/partenaire/valider-coupon \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"code": "ECO-2026-XXXXX"}'
```

**Résultat attendu:**
```json
{
  "id": 1,
  "code": "ECO-2026-XXXXX",
  "status": "UTILISE",
  "valideLe": "2026-05-29T..."
}
```

### 5.3 Vérifier la commission en base de données

```sql
SELECT * FROM commissions WHERE coupon_id = 1;
```

**Résultat attendu:**
```
id: 1
partenaire_id: 1
coupon_id: 1
valeur_dh: 12.5 (50 * 25%)
montant_commission: 1.25 (12.5 * 10%)
taux_commission: 10
mois_facturation: 2026-05
created_at: 2026-05-29T...
```

**Calcul de commission:**
- Valeur DH: 50
- Discount: 25%
- Valeur après discount: 50 * 25% = 12.5 DH
- Taux commission: 10%
- Commission: 12.5 * 10% = 1.25 DH ✅

---

## 📱 ÉTAPE 6: TESTER LE SCANNER DE COUPON

### 6.1 Accéder au scanner

1. Aller à: `http://localhost:4200/partenaire/scanner`

### 6.2 Entrer le code du coupon

```
Code: ECO-2026-XXXXX
```

### 6.3 Cliquer sur "Valider"

### 6.4 Vérifier le résultat

- ✅ Message de succès
- ✅ Coupon marqué comme UTILISE
- ✅ Commission calculée

---

## 📊 ÉTAPE 7: VÉRIFIER LE DASHBOARD MIS À JOUR

### 7.1 Aller au dashboard

1. Aller à: `http://localhost:4200/partenaire/dashboard`

### 7.2 Vérifier les statistiques mises à jour

**Avant le test:**
```
Offres actives: 0
Coupons distribués: 0
Coupons utilisés: 0
Taux conversion: 0%
Commissions ce mois: 0 DH
```

**Après le test:**
```
Offres actives: 1
Coupons distribués: 1
Coupons utilisés: 1
Taux conversion: 100%
Commissions ce mois: 1.25 DH
```

### 7.3 Vérifier les sections

- ✅ Hero section avec gradient
- ✅ 8 KPI cards avec icônes
- ✅ Offres actives affichées
- ✅ Échanges récents affichés
- ✅ Actions rapides visibles

---

## 🔍 ÉTAPE 8: VÉRIFIER LES LOGS

### 8.1 Logs du backend (service-recompense)

Vérifier que les logs contiennent:
```
✅ Coupon ECO-2026-XXXXX généré pour userId: 1
✅ Commission 1.25 DH calculée pour coupon ECO-2026-XXXXX
✅ Coupon ECO-2026-XXXXX validé par partenaire Ecopria
```

### 8.2 Logs du frontend (Console DevTools)

Vérifier que la console contient:
```
✅ userId initialisé à 1 (développement)
✅ Offre créée avec succès
✅ Offre modifiée avec succès
✅ Offre supprimée avec succès
```

---

## 🧪 ÉTAPE 9: TESTER AVEC DIFFÉRENTS TYPES D'OFFRES

### 9.1 Créer une offre de type REDUCTION

```
Titre:              "Réduction 30% sur tout"
Description:        "Réduction valable 1 mois"
Points:             75
Type:               REDUCTION
Valeur DH:          100
Discount %:         30
```

### 9.2 Créer une offre de type SERVICE

```
Titre:              "Consultation gratuite"
Description:        "Consultation d'1 heure"
Points:             200
Type:               SERVICE
Valeur DH:          150
Discount %:         10
```

### 9.3 Créer une offre de type EXPERIENCE

```
Titre:              "Visite guidée écologique"
Description:        "Visite de 2 heures"
Points:             300
Type:               EXPERIENCE
Valeur DH:          200
Discount %:         15
```

### 9.4 Vérifier en base de données

```sql
SELECT id, title, type, valeur_dh, discount_percentage FROM recompenses WHERE partenaire_id = 1;
```

**Résultat attendu:**
```
id: 1, title: "Café & pâtisserie maison", type: "STOCK", valeur_dh: 50, discount_percentage: 25
id: 3, title: "Réduction 30% sur tout", type: "REDUCTION", valeur_dh: 100, discount_percentage: 30
id: 4, title: "Consultation gratuite", type: "SERVICE", valeur_dh: 150, discount_percentage: 10
id: 5, title: "Visite guidée écologique", type: "EXPERIENCE", valeur_dh: 200, discount_percentage: 15
```

---

## ✅ CHECKLIST FINALE

- [ ] Infrastructure vérifiée (MySQL, Kafka, API Gateway, Frontend)
- [ ] Dashboard accessible et chargé
- [ ] userId initialisé correctement
- [ ] Création d'offre testée
- [ ] Offre visible en base de données
- [ ] Modification d'offre testée
- [ ] Suppression d'offre testée
- [ ] Calcul de commission testé
- [ ] Scanner de coupon testé
- [ ] Dashboard mis à jour avec les bonnes statistiques
- [ ] Logs du backend corrects
- [ ] Logs du frontend corrects
- [ ] Différents types d'offres testés
- [ ] Communication API Gateway vérifiée

---

## 📈 RÉSULTATS ATTENDUS

### Avant le test
```
❌ Aucune offre
❌ Aucun coupon
❌ Aucune commission
❌ Dashboard vide
```

### Après le test
```
✅ 4 offres créées (1 active, 1 supprimée, 2 autres types)
✅ 1 coupon utilisé
✅ 1 commission calculée (1.25 DH)
✅ Dashboard mis à jour
✅ Statistiques correctes
✅ Tous les types d'offres fonctionnent
```

---

## 🐛 DÉPANNAGE

### Problème: "Partenaire non trouvé"
**Solution:** Vérifier que le partenaire existe en base de données
```sql
SELECT * FROM partenaires WHERE user_id = 1;
```

### Problème: "Impossible de joindre le service"
**Solution:** Vérifier que le service-recompense est démarré
```bash
curl http://localhost:9093/api/recompenses
```

### Problème: "Commission non calculée"
**Solution:** Vérifier que `valeurDh` est défini
```sql
SELECT * FROM recompenses WHERE id = 1;
```

### Problème: "Données non sauvegardées"
**Solution:** Vérifier les logs du backend
```bash
docker logs -f service-recompense-backend
```

### Problème: "Port déjà utilisé"
**Solution:** Tuer le processus qui utilise le port
```bash
# Trouver le PID
netstat -ano | findstr :9093

# Tuer le processus
taskkill /PID <PID> /F
```

---

## 📞 COMMANDES UTILES

### Vérifier les services
```bash
docker compose ps
```

### Voir les logs du backend
```bash
docker logs -f service-recompense-backend
```

### Accéder à PhpMyAdmin
```
http://localhost:8888
Utilisateur: root
Mot de passe: root
Base: db_recompense
```

### Tester l'API directement
```bash
# Créer une offre
curl -X POST http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Récupérer les offres
curl http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1"

# Valider un coupon
curl -X POST http://localhost:8080/api/partenaire/valider-coupon \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"code": "ECO-2026-XXXXX"}'
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Suivre ce guide de test
2. ✅ Vérifier toutes les fonctionnalités
3. ✅ Tester le workflow complet
4. ✅ Vérifier les données en base de données
5. ✅ Vérifier les logs
6. ✅ Tester sur mobile (responsive)
7. ✅ Tester les erreurs (réseau, validation, etc.)

---

**Date:** 29 mai 2026  
**Status:** 🚀 PRÊT À TESTER

**Bonne chance! 🎉**
