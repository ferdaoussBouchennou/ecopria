# 🧪 GUIDE DE TEST INTERACTIF - ESPACE PARTENAIRE

## ✅ PRÉREQUIS VÉRIFIÉS

- ✅ Service-recompense: **PORT 9093** (EN COURS D'EXÉCUTION)
- ✅ MySQL db_recompense: **PORT 3311** (À VÉRIFIER)
- ✅ Kafka: **PORT 9092** (À VÉRIFIER)
- ⏳ API Gateway: **PORT 8080** (À DÉMARRER)
- ⏳ Frontend: **PORT 4200** (À DÉMARRER)

---

## 🚀 ÉTAPE 1: VÉRIFIER LES SERVICES

### 1.1 Vérifier que Docker est actif
```bash
docker compose ps
```

**Résultat attendu:**
```
mysql-recompense    Up    3311:3311
kafka               Up    9092:9092
```

### 1.2 Vérifier la connexion à la base de données
```bash
curl http://localhost:9093/api/recompenses
```

**Résultat attendu:**
```json
[]
```

---

## 🔧 ÉTAPE 2: DÉMARRER L'API GATEWAY

### 2.1 Ouvrir un nouveau terminal
```bash
cd c:\Users\user\Desktop\ecopria\backend\api-gateway
```

### 2.2 Démarrer l'API Gateway
```bash
.\mvnw spring-boot:run
```

**Logs attendus:**
```
Started ApiGatewayApplication in X seconds
Tomcat started on port(s): 8080
```

### 2.3 Vérifier que l'API Gateway fonctionne
```bash
curl http://localhost:8080/api/recompenses
```

**Résultat attendu:**
```json
[]
```

---

## 🎨 ÉTAPE 3: DÉMARRER LE FRONTEND

### 3.1 Ouvrir un nouveau terminal
```bash
cd c:\Users\user\Desktop\ecopria\frontend
```

### 3.2 Démarrer le frontend
```bash
npm start
```

**Logs attendus:**
```
✔ Compiled successfully
Local:   http://localhost:4200
```

### 3.3 Accéder au dashboard
```
http://localhost:4200/partenaire/dashboard
```

---

## 🧪 ÉTAPE 4: TESTER LA CRÉATION D'OFFRE

### 4.1 Accéder à la page de création
1. Aller à: `http://localhost:4200/partenaire/dashboard`
2. Cliquer sur le bouton **"+ Nouvelle offre"** (vert)

### 4.2 Remplir le formulaire
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

### 4.3 Cliquer sur "Créer"

### 4.4 Vérifier dans DevTools
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
  "type": "STOCK",
  "stock": 150,
  "discountPercentage": 20,
  "valeurDh": 50,
  "isActive": true,
  "createdAt": "2026-05-29T..."
}
```

### 4.5 Vérifier en base de données
```bash
# PhpMyAdmin: http://localhost:8888
# Base: db_recompense
# Table: recompenses

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
```

---

## ✏️ ÉTAPE 5: TESTER LA MODIFICATION D'OFFRE

### 5.1 Accéder à la page de modification
1. Aller à: `http://localhost:4200/partenaire/offres`
2. Cliquer sur l'offre "Café & pâtisserie maison"

### 5.2 Modifier les champs
```
Stock:              120 (au lieu de 150)
Discount %:         25 (au lieu de 20)
```

### 5.3 Cliquer sur "Modifier"

### 5.4 Vérifier dans DevTools
1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ PUT `/api/partenaire/offres/1`
   - ✅ Status: **200 OK**

### 5.5 Vérifier en base de données
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

## 💰 ÉTAPE 6: TESTER LE CALCUL DE COMMISSION

### 6.1 Créer un coupon (simuler un échange)

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

### 6.2 Valider le coupon (scanner)

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

### 6.3 Vérifier la commission en base de données

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

---

## 📱 ÉTAPE 7: TESTER LE SCANNER DE COUPON

### 7.1 Accéder au scanner
1. Aller à: `http://localhost:4200/partenaire/scanner`

### 7.2 Entrer le code du coupon
```
Code: ECO-2026-XXXXX
```

### 7.3 Cliquer sur "Valider"

### 7.4 Vérifier le résultat
- ✅ Message de succès
- ✅ Coupon marqué comme UTILISE
- ✅ Commission calculée

---

## 📊 ÉTAPE 8: VÉRIFIER LE DASHBOARD

### 8.1 Aller au dashboard
1. Aller à: `http://localhost:4200/partenaire/dashboard`

### 8.2 Vérifier les statistiques
- ✅ **Offres actives:** 1
- ✅ **Coupons distribués:** 1
- ✅ **Coupons utilisés:** 1
- ✅ **Taux conversion:** 100%
- ✅ **Commissions ce mois:** 1.25 DH

### 8.3 Vérifier les sections
- ✅ Hero section avec gradient
- ✅ 8 KPI cards avec icônes
- ✅ Offres actives affichées
- ✅ Échanges récents affichés
- ✅ Actions rapides visibles

---

## 🔍 ÉTAPE 9: VÉRIFIER LES LOGS

### 9.1 Logs du backend (service-recompense)
```
✅ Coupon ECO-2026-XXXXX généré pour userId: 1
✅ Commission 1.25 DH calculée pour coupon ECO-2026-XXXXX
✅ Coupon ECO-2026-XXXXX validé par partenaire Ecopria
```

### 9.2 Logs du frontend (Console DevTools)
```
✅ userId initialisé à 1 (développement)
✅ Offre créée avec succès
✅ Offre modifiée avec succès
```

---

## 🗑️ ÉTAPE 10: TESTER LA SUPPRESSION D'OFFRE

### 10.1 Créer une deuxième offre
1. Aller à: `http://localhost:4200/partenaire/offres/nouvelle`
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

### 10.2 Supprimer l'offre
1. Aller à: `http://localhost:4200/partenaire/offres`
2. Cliquer sur l'offre "Tote bag en coton bio"
3. Cliquer sur "Supprimer"
4. Confirmer la suppression

### 10.3 Vérifier dans DevTools
- ✅ DELETE `/api/partenaire/offres/2`
- ✅ Status: **200 OK**

### 10.4 Vérifier en base de données
```sql
SELECT * FROM recompenses WHERE id = 2;
```

**Résultat attendu:**
```
is_active: 0
```

---

## ✅ CHECKLIST DE TEST COMPLÈTE

- [ ] Service-recompense démarré (port 9093)
- [ ] API Gateway démarré (port 8080)
- [ ] Frontend démarré (port 4200)
- [ ] Création d'offre testée
- [ ] Modification d'offre testée
- [ ] Suppression d'offre testée
- [ ] Calcul de commission testé
- [ ] Scanner de coupon testé
- [ ] Dashboard affiche les bonnes données
- [ ] Logs du backend corrects
- [ ] Logs du frontend corrects
- [ ] Base de données vérifiée
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
✅ 1 offre active
✅ 1 coupon utilisé
✅ 1 commission calculée (1.25 DH)
✅ Dashboard mis à jour
✅ Statistiques correctes
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
# Voir les logs du terminal où le service est démarré
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
# Voir le terminal où le service est démarré
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
