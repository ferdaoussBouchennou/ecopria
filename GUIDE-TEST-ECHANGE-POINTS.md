# Guide de Test - Système d'Échange de Points

## 🎯 Situation Actuelle

- **Utilisateur connecté** : ID = 1 (authId)
- **Points dans la base de données** : 400 points (table `citizens`, colonne `total_points`)
- **Problème** : L'interface affiche "0 points"
- **Objectif** : Échanger des points contre une offre et obtenir un code de réduction à tester dans l'espace partenaire

---

## 📋 Architecture du Système

### Services Impliqués
1. **service-utilisateur** (port 8082) : Gestion des citoyens et de leurs points
2. **service-recompense** (port 8084) : Gestion des offres, échanges et codes coupons
3. **api-gateway** (port 8080) : Point d'entrée unique pour toutes les requêtes

### Base de Données
- `db_utilisateur` : Table `citizens` avec colonne `total_points`
- `db_recompense` : Tables `recompenses`, `coupons`, `partenaires`

---

## 🔍 Diagnostic du Problème "0 points"

### 1. Vérifier les Points dans la Base de Données

```sql
-- Se connecter à MySQL
mysql -u ecopria -p -h localhost -P 3307

-- Sélectionner la base de données
USE db_utilisateur;

-- Vérifier les points de l'utilisateur ID 1
SELECT id, auth_id, first_name, last_name, email, total_points, trust_score, city
FROM citizens
WHERE auth_id = 1;
```

**Résultat attendu :**
```
+----+---------+------------+-----------+------------------+--------------+-------------+------+
| id | auth_id | first_name | last_name | email            | total_points | trust_score | city |
+----+---------+------------+-----------+------------------+--------------+-------------+------+
|  1 |       1 | John       | Doe       | john@example.com |          400 |         100 | Casa |
+----+---------+------------+-----------+------------------+--------------+-------------+------+
```

### 2. Tester l'API de Récupération des Points

```bash
# Test direct sur le service-utilisateur (sans gateway)
curl -X GET http://localhost:8082/api/utilisateurs/1/points

# Test via l'API Gateway
curl -X GET http://localhost:8080/api/utilisateurs/1/points
```

**Réponse attendue :**
```json
{
  "totalPoints": 400
}
```

### 3. Vérifier le Dashboard de l'Utilisateur

```bash
curl -X GET http://localhost:8082/api/utilisateurs/1/dashboard
```

**Réponse attendue (extrait) :**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "totalPoints": 400,
  "level": 1,
  ...
}
```

---

## 🎁 Processus d'Échange de Points

### Étape 1 : Consulter le Catalogue des Offres

```bash
# Récupérer toutes les offres disponibles
curl -X GET http://localhost:8084/api/recompenses

# Filtrer par type (optionnel)
curl -X GET "http://localhost:8084/api/recompenses?type=STOCK"
curl -X GET "http://localhost:8084/api/recompenses?type=REDUCTION"
```

**Réponse exemple :**
```json
[
  {
    "id": 1,
    "title": "15% de réduction",
    "description": "Réduction de 15% sur votre prochaine commande",
    "imageUrl": "...",
    "pointsNecessaires": 150,
    "type": "REDUCTION",
    "discountPercentage": 15,
    "partenaireName": "Pizza House",
    "partenaireCategory": "RESTAURATION",
    "isActive": true
  },
  {
    "id": 2,
    "title": "Café Gourmand",
    "description": "Un café gourmand offert",
    "imageUrl": "...",
    "pointsNecessaires": 150,
    "type": "STOCK",
    "stock": 8,
    "partenaireName": "Café Bohème",
    "partenaireCategory": "RESTAURATION",
    "isActive": true
  }
]
```

### Étape 2 : Échanger des Points contre une Offre

```bash
# Échanger 150 points contre l'offre ID 2 (Café Gourmand)
curl -X POST http://localhost:8084/api/recompenses/echanger \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "recompenseId": 2
  }'
```

**Réponse attendue :**
```json
{
  "id": 1,
  "userId": 1,
  "code": "ECO-2026-A7K9M",
  "recompenseTitle": "Café Gourmand",
  "partenaireName": "Café Bohème",
  "pointsUtilises": 150,
  "status": "DISTRIBUE",
  "expireLe": "2026-07-04T14:30:00",
  "createdAt": "2026-06-04T14:30:00"
}
```

### Étape 3 : Vérifier le Solde de Points Après Échange

```bash
curl -X GET http://localhost:8082/api/utilisateurs/1/points
```

**Réponse attendue :**
```json
{
  "totalPoints": 250
}
```
*(400 - 150 = 250 points restants)*

### Étape 4 : Consulter Mes Coupons

```bash
curl -X GET http://localhost:8084/api/recompenses/mes-coupons \
  -H "X-User-Id: 1"
```

**Réponse attendue :**
```json
[
  {
    "id": 1,
    "code": "ECO-2026-A7K9M",
    "recompenseTitle": "Café Gourmand",
    "partenaireName": "Café Bohème",
    "pointsUtilises": 150,
    "status": "DISTRIBUE",
    "expireLe": "2026-07-04T14:30:00",
    "createdAt": "2026-06-04T14:30:00"
  }
]
```

---

## 🏪 Test du Code dans l'Espace Partenaire

### Étape 1 : Se Connecter en tant que Partenaire

Vous devez avoir un compte partenaire lié au commerce "Café Bohème". Vérifiez dans la base de données :

```sql
USE db_recompense;

-- Vérifier les partenaires
SELECT id, user_id, name, category, commission_rate
FROM partenaires;

-- Trouver le user_id du partenaire "Café Bohème"
```

### Étape 2 : Valider le Code Coupon

```bash
# Remplacer {PARTNER_USER_ID} par l'ID du partenaire (ex: 2)
# Remplacer {CODE} par le code reçu (ex: ECO-2026-A7K9M)

curl -X POST http://localhost:8084/api/partenaire/valider-coupon \
  -H "Content-Type: application/json" \
  -H "X-User-Id: {PARTNER_USER_ID}" \
  -d '{
    "code": "{CODE}"
  }'
```

**Exemple concret :**
```bash
curl -X POST http://localhost:8084/api/partenaire/valider-coupon \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{
    "code": "ECO-2026-A7K9M"
  }'
```

**Réponse de succès :**
```json
{
  "id": 1,
  "code": "ECO-2026-A7K9M",
  "recompenseTitle": "Café Gourmand",
  "partenaireName": "Café Bohème",
  "pointsUtilises": 150,
  "status": "UTILISE",
  "valideLe": "2026-06-04T15:00:00",
  "expireLe": "2026-07-04T14:30:00",
  "createdAt": "2026-06-04T14:30:00"
}
```

### Étape 3 : Vérifier que le Coupon ne Peut Plus Être Utilisé

```bash
# Essayer de valider à nouveau le même code
curl -X POST http://localhost:8084/api/partenaire/valider-coupon \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{
    "code": "ECO-2026-A7K9M"
  }'
```

**Réponse d'erreur attendue :**
```json
{
  "message": "Ce coupon a déjà été utilisé"
}
```

---

## 🔧 Solutions aux Problèmes Courants

### Problème 1 : "0 points" affiché malgré 400 points dans la DB

**Causes possibles :**
1. Le frontend n'appelle pas le bon endpoint
2. L'authId utilisé dans l'URL ne correspond pas à l'utilisateur connecté
3. Problème de CORS ou de routage via l'API Gateway

**Solutions :**
```bash
# 1. Vérifier que l'endpoint fonctionne directement
curl http://localhost:8082/api/utilisateurs/1/points

# 2. Vérifier via le gateway
curl http://localhost:8080/api/utilisateurs/1/points

# 3. Vérifier les logs du service-utilisateur
# Chercher les requêtes GET /api/utilisateurs/{id}/points
```

### Problème 2 : "Points insuffisants" lors de l'échange

```sql
-- Mettre à jour manuellement les points si nécessaire
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

### Problème 3 : Aucune offre disponible

```sql
-- Vérifier les offres actives
USE db_recompense;
SELECT id, title, points_necessaires, type, stock, is_active, partenaire_id
FROM recompenses
WHERE is_active = true;

-- Activer une offre manuellement si nécessaire
UPDATE recompenses SET is_active = true WHERE id = 1;
```

---

## 📊 Vérifications Complètes de Base de Données

### 1. Vérifier l'Utilisateur

```sql
USE db_utilisateur;

-- Profil complet
SELECT * FROM citizens WHERE auth_id = 1;

-- Historique des points
SELECT * FROM point_history WHERE citizen_id = 1 ORDER BY created_at DESC LIMIT 10;

-- Badges obtenus
SELECT ub.*, b.name, b.icon 
FROM user_badges ub 
JOIN badges b ON ub.badge_id = b.id 
WHERE ub.citizen_id = 1;
```

### 2. Vérifier les Offres et Coupons

```sql
USE db_recompense;

-- Toutes les offres
SELECT * FROM recompenses ORDER BY created_at DESC;

-- Mes coupons
SELECT c.*, r.title as recompense_title 
FROM coupons c 
JOIN recompenses r ON c.recompense_id = r.id 
WHERE c.user_id = 1 
ORDER BY c.created_at DESC;

-- Commissions générées
SELECT * FROM commissions ORDER BY created_at DESC LIMIT 10;
```

---

## 🎨 Interface Frontend - Localisation du Problème

D'après la capture d'écran, le problème se trouve sur la page qui affiche :
- "Votre solde de points" avec "0 points" en vert
- Des offres disponibles en dessous

**À vérifier dans le code frontend :**

1. Quelle route/page est-ce ? (probablement `/offres` ou `/recompenses`)
2. Quel composant charge les points de l'utilisateur ?
3. Quel endpoint est appelé ?

**Exemple de code à chercher dans le frontend :**
```javascript
// Chercher dans les fichiers .tsx, .ts, .vue ou .jsx
// Mots-clés à rechercher : "points", "solde", "totalPoints", "getPoints"

// Exemple d'appel API qui devrait exister
const fetchUserPoints = async (userId) => {
  const response = await api.get(`/api/utilisateurs/${userId}/points`);
  return response.data.totalPoints;
};
```

---

## ✅ Checklist de Test Complète

- [ ] 1. Vérifier que l'utilisateur ID 1 a bien 400 points dans la DB
- [ ] 2. Tester l'endpoint GET `/api/utilisateurs/1/points` (devrait retourner 400)
- [ ] 3. Consulter le catalogue des offres
- [ ] 4. Échanger 150 points contre une offre (ex: Café Gourmand)
- [ ] 5. Vérifier que le code coupon est généré (format: ECO-2026-XXXXX)
- [ ] 6. Vérifier que le solde est maintenant 250 points
- [ ] 7. Se connecter en tant que partenaire
- [ ] 8. Valider le code coupon dans l'espace partenaire
- [ ] 9. Vérifier que le statut passe de DISTRIBUE à UTILISE
- [ ] 10. Vérifier que la commission est calculée et enregistrée

---

## 🚀 Commandes Rapides pour Démarrer les Services

```bash
# Démarrer MySQL (si Docker)
docker-compose up -d mysql

# Démarrer Kafka (si Docker)
docker-compose up -d kafka zookeeper

# Démarrer service-utilisateur
cd backend/service-utilisateur
mvnw spring-boot:run

# Démarrer service-recompense
cd backend/service-recompense
mvnw spring-boot:run

# Démarrer api-gateway
cd backend/api-gateway
mvnw spring-boot:run
```

---

## 📝 Notes Importantes

1. **authId vs id** : Dans la table `citizens`, `auth_id` est la référence à l'utilisateur authentifié (provient de `db_auth`), tandis que `id` est la clé primaire locale.

2. **Expiration des coupons** : Les coupons expirent 30 jours après leur génération s'ils ne sont pas utilisés.

3. **Calcul des commissions** : 
   - Si l'offre a un pourcentage de réduction ET une `valeurDh`, la commission est calculée sur la remise
   - Si l'offre est 100% gratuite, aucune commission n'est générée

4. **Événements Kafka** : L'échange déclenche plusieurs événements :
   - `recompense.echangee` → Le service-utilisateur déduit les points
   - `recompense.echangee` → Le service-notification envoie un email avec le code

---

## 🆘 Aide Supplémentaire

Si vous avez besoin d'aide pour :
- Déboguer le problème "0 points" dans le frontend
- Créer des données de test supplémentaires
- Comprendre un flux spécifique

N'hésitez pas à demander !
