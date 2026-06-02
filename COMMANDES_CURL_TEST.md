# 🔧 COMMANDES CURL - TEST API ESPACE PARTENAIRE

**Date:** 29 mai 2026  
**API Gateway:** http://localhost:8080  
**Service-recompense:** http://localhost:9093

---

## 📋 PRÉREQUIS

- Curl installé (ou Postman)
- API Gateway en cours d'exécution (port 8080)
- Service-recompense en cours d'exécution (port 9093)
- MySQL en cours d'exécution (port 3311)

---

## 🧪 TEST 1: CRÉER UNE OFFRE (TYPE STOCK)

### Commande curl

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

### Résultat attendu

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
  "createdAt": "2026-05-29T18:50:00Z"
}
```

### Vérification en base de données

```sql
SELECT * FROM recompenses WHERE id = 1;
```

---

## 🧪 TEST 2: RÉCUPÉRER LES OFFRES

### Commande curl

```bash
curl -X GET http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Résultat attendu

```json
[
  {
    "id": 1,
    "title": "Café & pâtisserie maison",
    "type": "STOCK",
    "stock": 150,
    "discountPercentage": 20,
    "valeurDh": 50,
    "isActive": true
  }
]
```

---

## 🧪 TEST 3: MODIFIER UNE OFFRE

### Commande curl

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

### Résultat attendu

```json
{
  "id": 1,
  "title": "Café & pâtisserie maison",
  "type": "STOCK",
  "stock": 120,
  "discountPercentage": 25,
  "valeurDh": 50,
  "isActive": true,
  "updatedAt": "2026-05-29T18:51:00Z"
}
```

### Vérification en base de données

```sql
SELECT * FROM recompenses WHERE id = 1;
```

---

## 🧪 TEST 4: SUPPRIMER UNE OFFRE

### Commande curl

```bash
curl -X DELETE http://localhost:8080/api/partenaire/offres/1 \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Résultat attendu

```json
{
  "message": "Offre supprimée avec succès",
  "id": 1
}
```

### Vérification en base de données

```sql
SELECT * FROM recompenses WHERE id = 1;
-- is_active doit être 0
```

---

## 💰 TEST 5: CRÉER UN COUPON (ÉCHANGER UNE OFFRE)

### Commande curl

```bash
curl -X POST http://localhost:8080/api/recompenses/echanger \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "recompenseId": 1
  }'
```

### Résultat attendu

```json
{
  "id": 1,
  "code": "ECO-2026-XXXXX",
  "status": "DISTRIBUE",
  "pointsUtilises": 100,
  "createdAt": "2026-05-29T18:52:00Z"
}
```

### Vérification en base de données

```sql
SELECT * FROM coupons WHERE id = 1;
```

---

## 🔍 TEST 6: VALIDER UN COUPON (SCANNER)

### Commande curl

```bash
curl -X POST http://localhost:8080/api/partenaire/valider-coupon \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ECO-2026-XXXXX"
  }'
```

### Résultat attendu

```json
{
  "id": 1,
  "code": "ECO-2026-XXXXX",
  "status": "UTILISE",
  "valideLe": "2026-05-29T18:53:00Z"
}
```

### Vérification en base de données

```sql
SELECT * FROM coupons WHERE id = 1;
-- status doit être UTILISE
```

---

## 💳 TEST 7: VÉRIFIER LA COMMISSION

### Commande curl

```bash
curl -X GET http://localhost:8080/api/partenaire/commissions \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Résultat attendu

```json
[
  {
    "id": 1,
    "couponId": 1,
    "valeurDh": 12.5,
    "montantCommission": 1.25,
    "tauxCommission": 10,
    "moisFacturation": "2026-05",
    "createdAt": "2026-05-29T18:53:00Z"
  }
]
```

### Vérification en base de données

```sql
SELECT * FROM commissions WHERE coupon_id = 1;
```

**Calcul de commission:**
- Valeur DH: 50
- Discount: 25%
- Valeur après discount: 50 * 25% = 12.5 DH
- Taux commission: 10%
- Commission: 12.5 * 10% = 1.25 DH ✅

---

## 📊 TEST 8: RÉCUPÉRER LE DASHBOARD

### Commande curl

```bash
curl -X GET http://localhost:8080/api/partenaire/dashboard \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Résultat attendu

```json
{
  "partenaireName": "Ecopria",
  "vuesProfilPublic": 1842,
  "clicsVersOffres": 624,
  "couponsDistribues": 1,
  "couponsUtilises": 1,
  "tauxUtilisation": 100,
  "noteMoyenne": 4.7,
  "nombreAvis": 3,
  "commissionsARegler": 1.25,
  "badgeActuel": "Bronze",
  "offresActives": [
    {
      "id": 1,
      "title": "Café & pâtisserie maison",
      "type": "STOCK",
      "stock": 120,
      "discountPercentage": 25,
      "valeurDh": 50
    }
  ],
  "echangesRecents": [
    {
      "id": 1,
      "code": "ECO-2026-XXXXX",
      "status": "UTILISE",
      "valideLe": "2026-05-29T18:53:00Z"
    }
  ]
}
```

---

## 🧪 TEST 9: CRÉER PLUSIEURS OFFRES (DIFFÉRENTS TYPES)

### Offre REDUCTION

```bash
curl -X POST http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Réduction 30% sur tout",
    "description": "Réduction valable 1 mois",
    "type": "REDUCTION",
    "discountPercentage": 30,
    "valeurDh": 100,
    "expirationDate": "2026-12-31"
  }'
```

### Offre SERVICE

```bash
curl -X POST http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Consultation gratuite",
    "description": "Consultation d'\''1 heure",
    "type": "SERVICE",
    "discountPercentage": 10,
    "valeurDh": 150,
    "expirationDate": "2026-12-31"
  }'
```

### Offre EXPERIENCE

```bash
curl -X POST http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visite guidée écologique",
    "description": "Visite de 2 heures",
    "type": "EXPERIENCE",
    "discountPercentage": 15,
    "valeurDh": 200,
    "expirationDate": "2026-12-31"
  }'
```

---

## 🔄 TEST 10: TESTER AVEC DIFFÉRENTS UTILISATEURS

### Créer une offre pour userId: 2

```bash
curl -X POST http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Offre du partenaire 2",
    "description": "Description",
    "type": "STOCK",
    "stock": 100,
    "discountPercentage": 15,
    "valeurDh": 75,
    "expirationDate": "2026-12-31"
  }'
```

### Récupérer les offres pour userId: 2

```bash
curl -X GET http://localhost:8080/api/partenaire/offres \
  -H "X-User-Id: 2" \
  -H "Content-Type: application/json"
```

### Vérification en base de données

```sql
SELECT * FROM recompenses WHERE partenaire_id = 2;
```

---

## 📝 NOTES IMPORTANTES

1. **Header X-User-Id:** Obligatoire dans toutes les requêtes
2. **Content-Type:** Toujours `application/json`
3. **Codes de coupon:** Format `ECO-2026-XXXXX`
4. **Commission:** Calculée automatiquement lors de la validation du coupon
5. **Multi-utilisateur:** Changer le header `X-User-Id` pour tester avec différents utilisateurs

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

## 🔗 LIENS UTILES

### API Gateway
- Base URL: http://localhost:8080
- Endpoints: `/api/partenaire/*`, `/api/recompenses/*`

### Service-recompense
- Base URL: http://localhost:9093
- Endpoints: `/api/recompenses/*`

### Base de données
- PhpMyAdmin: http://localhost:8888
- Utilisateur: root
- Mot de passe: root

---

## 📊 RÉSUMÉ DES TESTS

| Test | Endpoint | Méthode | Status |
|------|----------|---------|--------|
| Créer offre | `/api/partenaire/offres` | POST | ✅ |
| Récupérer offres | `/api/partenaire/offres` | GET | ✅ |
| Modifier offre | `/api/partenaire/offres/{id}` | PUT | ✅ |
| Supprimer offre | `/api/partenaire/offres/{id}` | DELETE | ✅ |
| Créer coupon | `/api/recompenses/echanger` | POST | ✅ |
| Valider coupon | `/api/partenaire/valider-coupon` | POST | ✅ |
| Récupérer commissions | `/api/partenaire/commissions` | GET | ✅ |
| Récupérer dashboard | `/api/partenaire/dashboard` | GET | ✅ |

---

**Date:** 29 mai 2026  
**Status:** 🚀 PRÊT À TESTER

**Bonne chance! 🎉**
