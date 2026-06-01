# 🧪 WORKFLOW TEST COMPLET - ESPACE PARTENAIRE

## 📋 OBJECTIF

Tester le flux complet de l'espace partenaire avec:
- ✅ Communication via API Gateway
- ✅ Création d'offre
- ✅ Modification d'offre
- ✅ Suppression d'offre
- ✅ Calcul de commission
- ✅ Scanner de coupon
- ✅ Vérification en base de données

---

## 🚀 ÉTAPE 1: DÉMARRAGE DE L'INFRASTRUCTURE

### 1.1 Arrêter la stack complète (si elle tourne)
```bash
docker compose down
```

### 1.2 Démarrer uniquement l'infrastructure (BDD + Kafka)
```bash
docker compose -f docker-compose.infra.yml up -d
# OU
docker compose up -d mysql-auth mysql-utilisateur mysql-action mysql-inscription mysql-presence mysql-recompense kafka
```

**Vérifier:**
```bash
docker compose ps
```

**Résultat attendu:**
```
mysql-recompense    Up    3311:3311
kafka               Up    9092:9092
```

---

## 🔧 ÉTAPE 2: DÉMARRER LES MICROSERVICES

### 2.1 Service-recompense (le plus important)
```bash
cd backend/service-recompense
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Vérifier:**
```bash
curl http://localhost:9093/api/recompenses
# Résultat: []
```

### 2.2 API Gateway
```bash
cd backend/api-gateway
mvn spring-boot:run
```

**Vérifier:**
```bash
curl http://localhost:8080/api/recompenses
# Résultat: []
```

### 2.3 Frontend
```bash
cd frontend
npm start
```

**Vérifier:**
```
http://localhost:4200/partenaire/dashboard
```

---

## 📊 ÉTAPE 3: VÉRIFIER LA COMMUNICATION

### 3.1 Vérifier que le frontend appelle l'API Gateway
1. Ouvrir DevTools (F12)
2. Aller à l'onglet "Network"
3. Rafraîchir la page
4. Vérifier les requêtes:
   - ✅ GET `/api/partenaire/dashboard` (via API Gateway)
   - ✅ Status: 200 OK

### 3.2 Vérifier les headers
1. Cliquer sur une requête
2. Aller à "Headers"
3. Vérifier:
   - ✅ `X-User-Id: 1`
   - ✅ `Content-Type: application/json`

### 3.3 Vérifier la réponse
1. Aller à l'onglet "Response"
2. Vérifier que les données sont présentes:
   ```json
   {
     "partenaireName": "Ecopria",
     "vuesProfilPublic": 1842,
     "clicsVersOffres": 624,
     "couponsDistribues": 0,
     "couponsUtilises": 0,
     "tauxUtilisation": 0,
     "noteMoyenne": 4.7,
     "nombreAvis": 3,
     "commissionsARegler": 0,
     "badgeActuel": "Bronze",
     "offresActives": [],
     "echangesRecents": []
   }
   ```

---

## ✅ ÉTAPE 4: TESTER LA CRÉATION D'OFFRE

### 4.1 Créer une offre via l'interface
1. Aller à: `http://localhost:4200/partenaire/dashboard`
2. Cliquer sur "Nouvelle offre" (bouton vert)
3. Remplir le formulaire:
   - **Titre:** "Café & pâtisserie maison"
   - **Description:** "Café frais et pâtisseries artisanales"
   - **Points:** 100
   - **Type:** STOCK
   - **Stock:** 150
   - **Valeur DH:** 50
   - **Discount %:** 20
   - **Date expiration:** 31/12/2026
4. Cliquer sur "Créer"

### 4.2 Vérifier dans DevTools
1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ POST `/api/partenaire/offres`
   - ✅ Status: 201 Created
   - ✅ Response contient l'offre créée

### 4.3 Vérifier en base de données
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
created_at: 2026-05-26 20:30:00
```

---

## ✏️ ÉTAPE 5: TESTER LA MODIFICATION D'OFFRE

### 5.1 Modifier l'offre via l'interface
1. Aller à: `http://localhost:4200/partenaire/offres`
2. Cliquer sur l'offre "Café & pâtisserie maison"
3. Modifier:
   - **Stock:** 120 (au lieu de 150)
   - **Discount %:** 25 (au lieu de 20)
4. Cliquer sur "Modifier"

### 5.2 Vérifier dans DevTools
1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ PUT `/api/partenaire/offres/1`
   - ✅ Status: 200 OK

### 5.3 Vérifier en base de données
```sql
SELECT * FROM recompenses WHERE id = 1;
```

**Résultat attendu:**
```
stock: 120
discount_percentage: 25
updated_at: 2026-05-26 20:35:00
```

---

## 🗑️ ÉTAPE 6: TESTER LA SUPPRESSION D'OFFRE

### 6.1 Créer une deuxième offre
1. Aller à: `http://localhost:4200/partenaire/offres/nouvelle`
2. Remplir le formulaire:
   - **Titre:** "Tote bag en coton bio"
   - **Description:** "Sac réutilisable écologique"
   - **Points:** 50
   - **Type:** STOCK
   - **Stock:** 200
   - **Valeur DH:** 30
   - **Discount %:** 15
3. Cliquer sur "Créer"

### 6.2 Supprimer l'offre
1. Aller à: `http://localhost:4200/partenaire/offres`
2. Cliquer sur l'offre "Tote bag en coton bio"
3. Cliquer sur "Supprimer"
4. Confirmer la suppression

### 6.3 Vérifier dans DevTools
1. Ouvrir DevTools (F12)
2. Aller à "Network"
3. Vérifier la requête:
   - ✅ DELETE `/api/partenaire/offres/2`
   - ✅ Status: 200 OK

### 6.4 Vérifier en base de données
```sql
SELECT * FROM recompenses WHERE id = 2;
```

**Résultat attendu:**
```
is_active: 0
```

---

## 💰 ÉTAPE 7: TESTER LE CALCUL DE COMMISSION

### 7.1 Créer un coupon (simuler un échange)
```bash
# Utiliser Postman ou curl

POST http://localhost:8080/api/recompenses/echanger
Headers:
  X-User-Id: 1
  Content-Type: application/json
Body:
{
  "recompenseId": 1
}
```

**Résultat attendu:**
```json
{
  "id": 1,
  "code": "ECO-2026-XXXXX",
  "status": "DISTRIBUE",
  "pointsUtilises": 100,
  "createdAt": "2026-05-26T20:40:00"
}
```

### 7.2 Valider le coupon (scanner)
```bash
POST http://localhost:8080/api/partenaire/valider-coupon
Headers:
  X-User-Id: 1
  Content-Type: application/json
Body:
{
  "code": "ECO-2026-XXXXX"
}
```

**Résultat attendu:**
```json
{
  "id": 1,
  "code": "ECO-2026-XXXXX",
  "status": "UTILISE",
  "valideLe": "2026-05-26T20:41:00"
}
```

### 7.3 Vérifier la commission en base de données
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
created_at: 2026-05-26 20:41:00
```

---

## 📱 ÉTAPE 8: TESTER LE SCANNER DE COUPON

### 8.1 Accéder au scanner
1. Aller à: `http://localhost:4200/partenaire/scanner`
2. Entrer le code du coupon: `ECO-2026-XXXXX`
3. Cliquer sur "Valider"

### 8.2 Vérifier le résultat
- ✅ Message de succès
- ✅ Coupon marqué comme UTILISE
- ✅ Commission calculée

---

## 📊 ÉTAPE 9: VÉRIFIER LES STATISTIQUES

### 9.1 Aller au dashboard
1. Aller à: `http://localhost:4200/partenaire/dashboard`

### 9.2 Vérifier les statistiques
- ✅ Offres actives: 1
- ✅ Coupons distribués: 1
- ✅ Coupons utilisés: 1
- ✅ Taux conversion: 100%
- ✅ Commissions ce mois: 1.25 DH

---

## 🔍 ÉTAPE 10: VÉRIFIER LES LOGS

### 10.1 Logs du backend
```bash
docker logs -f service-recompense
```

**Logs attendus:**
```
✅ Coupon ECO-2026-XXXXX généré pour userId: 1
✅ Commission 1.25 DH calculée pour coupon ECO-2026-XXXXX
✅ Coupon ECO-2026-XXXXX validé par partenaire Ecopria
```

### 10.2 Logs du frontend
```bash
# Voir la console du navigateur (F12)
```

**Logs attendus:**
```
✅ userId initialisé à 1 (développement)
✅ Offre créée avec succès
✅ Offre modifiée avec succès
✅ Offre supprimée avec succès
```

---

## ✅ CHECKLIST FINALE

- [ ] Infrastructure démarrée (Docker)
- [ ] Service-recompense démarré
- [ ] API Gateway démarré
- [ ] Frontend démarré
- [ ] Communication via API Gateway vérifiée
- [ ] Création d'offre testée
- [ ] Modification d'offre testée
- [ ] Suppression d'offre testée
- [ ] Calcul de commission testé
- [ ] Scanner de coupon testé
- [ ] Statistiques vérifiées
- [ ] Logs vérifiés
- [ ] Base de données vérifiée

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
docker logs -f service-recompense
```

---

## 📈 RÉSULTATS ATTENDUS

### Avant le test
```
❌ Aucune offre
❌ Aucun coupon
❌ Aucune commission
```

### Après le test
```
✅ 1 offre active
✅ 1 coupon utilisé
✅ 1 commission calculée (1.25 DH)
✅ Statistiques mises à jour
```

---

**Date:** 26 mai 2026  
**Status:** 🚀 PRÊT À TESTER
