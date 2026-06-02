# 🚀 COMMENCER LES TESTS - ESPACE PARTENAIRE

**Date:** 29 mai 2026  
**Status:** 🟢 TOUS LES SERVICES SONT EN COURS D'EXÉCUTION

---

## ✅ VÉRIFICATION RAPIDE

Avant de commencer, vérifiez que tous les services sont en cours d'exécution:

```bash
# Vérifier les services Docker
docker compose ps

# Résultat attendu:
# mysql-recompense    Up    3311:3306
# kafka               Up    9092:9092
```

---

## 🎯 OPTION 1: TESTER VIA L'INTERFACE WEB (Recommandé)

### Étape 1: Accéder au dashboard

Ouvrez votre navigateur et allez à:
```
http://localhost:4200/partenaire/dashboard
```

### Étape 2: Créer une offre

1. Cliquez sur le bouton **"Nouvelle offre"** (vert)
2. Remplissez le formulaire:
   - **Titre:** "Café & pâtisserie maison"
   - **Description:** "Café frais et pâtisseries artisanales"
   - **Points:** 100
   - **Type:** STOCK
   - **Stock:** 150
   - **Valeur DH:** 50
   - **Discount %:** 20
   - **Date expiration:** 31/12/2026
3. Cliquez sur **"Créer"**

### Étape 3: Vérifier en base de données

1. Ouvrez PhpMyAdmin: http://localhost:8888
2. Utilisateur: `root`
3. Mot de passe: `root`
4. Allez à: `db_recompense` → `recompenses`
5. Vérifiez que l'offre est présente

### Étape 4: Modifier l'offre

1. Allez à: http://localhost:4200/partenaire/offres
2. Cliquez sur l'offre "Café & pâtisserie maison"
3. Modifiez:
   - **Stock:** 120 (au lieu de 150)
   - **Discount %:** 25 (au lieu de 20)
4. Cliquez sur **"Modifier"**

### Étape 5: Supprimer l'offre

1. Allez à: http://localhost:4200/partenaire/offres
2. Cliquez sur l'offre
3. Cliquez sur **"Supprimer"**
4. Confirmez la suppression

### Étape 6: Créer un coupon

Utilisez curl ou Postman:

```bash
curl -X POST http://localhost:8080/api/recompenses/echanger \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"recompenseId": 1}'
```

Notez le code du coupon (ex: `ECO-2026-XXXXX`)

### Étape 7: Valider le coupon

```bash
curl -X POST http://localhost:8080/api/partenaire/valider-coupon \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"code": "ECO-2026-XXXXX"}'
```

### Étape 8: Vérifier la commission

1. Ouvrez PhpMyAdmin: http://localhost:8888
2. Allez à: `db_recompense` → `commissions`
3. Vérifiez que la commission est présente:
   - **valeur_dh:** 12.5 (50 * 25%)
   - **montant_commission:** 1.25 (12.5 * 10%)

### Étape 9: Vérifier le dashboard

1. Allez à: http://localhost:4200/partenaire/dashboard
2. Vérifiez que les statistiques sont mises à jour:
   - **Offres actives:** 1
   - **Coupons distribués:** 1
   - **Coupons utilisés:** 1
   - **Taux conversion:** 100%
   - **Commissions ce mois:** 1.25 DH

---

## 🔧 OPTION 2: TESTER VIA CURL (Pour les développeurs)

### Commande 1: Créer une offre

```bash
curl -X POST http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Café & pâtisserie maison",
    "description": "Café frais et pâtisseries artisanales",
    "type": "STOCK",
    "stock": 150,
    "discountPercentage": 20,
    "valeurDh": 50,
    "expirationDate": "2026-12-31"
  }'
```

### Commande 2: Récupérer les offres

```bash
curl -X GET http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Commande 3: Modifier une offre

```bash
curl -X PUT http://localhost:8080/api/partenaire/offres/1 \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Café & pâtisserie maison",
    "description": "Café frais et pâtisseries artisanales",
    "type": "STOCK",
    "stock": 120,
    "discountPercentage": 25,
    "valeurDh": 50,
    "expirationDate": "2026-12-31"
  }'
```

### Commande 4: Supprimer une offre

```bash
curl -X DELETE http://localhost:8080/api/partenaire/offres/1 \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Commande 5: Créer un coupon

```bash
curl -X POST http://localhost:8080/api/recompenses/echanger \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"recompenseId": 1}'
```

### Commande 6: Valider un coupon

```bash
curl -X POST http://localhost:8080/api/partenaire/valider-coupon \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"code": "ECO-2026-XXXXX"}'
```

### Commande 7: Récupérer les commissions

```bash
curl -X GET http://localhost:8080/api/partenaire/commissions \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Commande 8: Récupérer le dashboard

```bash
curl -X GET http://localhost:8080/api/partenaire/dashboard \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

---

## 📱 OPTION 3: TESTER VIA POSTMAN

### Étape 1: Importer les commandes

1. Ouvrez Postman
2. Créez une nouvelle collection
3. Importez les commandes curl ci-dessus

### Étape 2: Configurer les variables

1. Créez une variable d'environnement: `base_url` = `http://localhost:8080`
2. Créez une variable d'environnement: `user_id` = `1`

### Étape 3: Exécuter les tests

1. Exécutez chaque requête dans l'ordre
2. Vérifiez les résultats
3. Vérifiez en base de données

---

## 📊 RÉSULTATS ATTENDUS

### Avant les tests
```
❌ Aucune offre
❌ Aucun coupon
❌ Aucune commission
❌ Dashboard vide
```

### Après les tests
```
✅ 1 offre créée
✅ 1 offre modifiée
✅ 1 offre supprimée
✅ 1 coupon créé
✅ 1 coupon validé
✅ 1 commission calculée (1.25 DH)
✅ Dashboard mis à jour
```

---

## 🔍 VÉRIFICATIONS EN BASE DE DONNÉES

### Vérifier les offres

```sql
SELECT * FROM recompenses WHERE partenaire_id = 1;
```

### Vérifier les coupons

```sql
SELECT * FROM coupons WHERE user_id = 1;
```

### Vérifier les commissions

```sql
SELECT * FROM commissions WHERE partenaire_id = 1;
```

---

## 🐛 DÉPANNAGE

### Erreur: "Unauthorized"
```
Solution: Vérifier que le header X-User-Id est présent
```

### Erreur: "Partenaire non trouvé"
```
Solution: Vérifier que le partenaire existe en base de données
SELECT * FROM partenaires WHERE user_id = 1;
```

### Erreur: "Offre non trouvée"
```
Solution: Vérifier que l'offre existe en base de données
SELECT * FROM recompenses WHERE id = 1;
```

### Erreur: "Commission non calculée"
```
Solution: Vérifier que valeurDh est défini
SELECT * FROM recompenses WHERE id = 1;
```

---

## 📞 SUPPORT

### Logs du backend

```bash
# Voir les logs du service-recompense
docker logs -f service-recompense-backend
```

### Logs du frontend

```bash
# Ouvrir DevTools (F12) et aller à la console
```

### Accéder à PhpMyAdmin

```
URL: http://localhost:8888
Utilisateur: root
Mot de passe: root
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consultez:
- `TEST_COMPLET_ESPACE_PARTENAIRE.md` - Guide complet de test
- `COMMANDES_CURL_TEST.md` - Toutes les commandes curl
- `ETAT_ACTUEL_SYSTEME.md` - État actuel du système
- `RESUME_FINAL_PRET_TEST.md` - Résumé final

---

## ✅ CHECKLIST

- [ ] Tous les services sont en cours d'exécution
- [ ] Accès au dashboard: http://localhost:4200/partenaire/dashboard
- [ ] Création d'offre testée
- [ ] Offre visible en base de données
- [ ] Modification d'offre testée
- [ ] Suppression d'offre testée
- [ ] Coupon créé et validé
- [ ] Commission calculée correctement
- [ ] Dashboard mis à jour
- [ ] Tous les tests réussis

---

**Status:** 🚀 PRÊT À TESTER

**Date:** 29 mai 2026

**Bonne chance! 🎉**
