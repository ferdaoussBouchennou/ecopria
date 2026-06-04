# Solution au Problème "0 Points" Affiché

## 🔴 Problème Constaté

L'interface web affiche **"0 points"** alors que l'utilisateur ID 1 possède **400 points** dans la base de données (table `citizens`, colonne `total_points`).

---

## 🔍 Diagnostic Rapide

### Étape 1 : Vérifier la Base de Données

```sql
USE db_utilisateur;
SELECT auth_id, first_name, last_name, total_points 
FROM citizens 
WHERE auth_id = 1;
```

**Résultat attendu :** `total_points = 400`

### Étape 2 : Tester l'API Backend

```bash
# Test direct sur le service-utilisateur
curl http://localhost:8082/api/utilisateurs/1/points

# Test via l'API Gateway
curl http://localhost:8080/api/utilisateurs/1/points
```

**Résultat attendu :**
```json
{
  "totalPoints": 400
}
```

Si ces deux commandes retournent bien `400`, alors **le problème est dans le frontend** (interface web).

Si elles retournent `0` ou une erreur, alors **le problème est dans le backend**.

---

## ✅ Solutions selon le Cas

### CAS 1 : L'API Backend Retourne 400 ✓ mais l'Interface Affiche 0 ✗

**→ Le problème est dans le code frontend**

#### Causes Possibles :

1. **Le frontend appelle le mauvais endpoint**
   - Vérifier quelle URL est appelée dans le code JavaScript/TypeScript
   - Rechercher dans les fichiers : `"points"`, `"solde"`, `"totalPoints"`

2. **L'authId utilisé n'est pas le bon**
   - Le frontend utilise peut-être un ID différent de 1
   - Vérifier la valeur stockée dans le localStorage ou le token JWT

3. **Problème de parsing de la réponse**
   - Le frontend ne lit peut-être pas correctement `response.data.totalPoints`

#### Solution Frontend :

Trouvez le fichier qui affiche les points (probablement dans la page des offres) et vérifiez :

```typescript
// Exemple de code à chercher et corriger

// ❌ MAUVAIS
const points = response.data.points; // Property 'points' n'existe pas

// ✅ BON
const points = response.data.totalPoints;

// ❌ MAUVAIS (authId incorrecte)
const response = await api.get(`/api/utilisateurs/0/points`);

// ✅ BON (utiliser l'authId de l'utilisateur connecté)
const authId = getUserAuthId(); // ou depuis le token JWT
const response = await api.get(`/api/utilisateurs/${authId}/points`);
```

#### Vérifications à Faire :

```javascript
// 1. Vérifier l'authId de l'utilisateur connecté
console.log("User authId:", localStorage.getItem('authId'));
// ou
console.log("User authId:", parseJwt(token).sub);

// 2. Vérifier l'appel API
const response = await api.get(`/api/utilisateurs/${authId}/points`);
console.log("Points response:", response.data);
// Devrait afficher : { totalPoints: 400 }

// 3. Vérifier l'assignation
const points = response.data.totalPoints;
console.log("Points extraits:", points);
// Devrait afficher : 400
```

---

### CAS 2 : L'API Backend Retourne 0 ou une Erreur ✗

**→ Le problème est dans le backend**

#### Causes Possibles :

1. **L'utilisateur n'existe pas avec cet authId**
   ```sql
   SELECT * FROM citizens WHERE auth_id = 1;
   -- Retourne aucune ligne ?
   ```

2. **La colonne total_points est à NULL ou 0**
   ```sql
   UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
   ```

3. **Le service-utilisateur ne démarre pas correctement**
   - Vérifier les logs du service
   - Vérifier la connexion à MySQL

---

## 🚀 Test Complet du Système

Une fois le problème "0 points" résolu, testez l'échange complet :

### 1. Utiliser le Script PowerShell (Windows)

```powershell
cd C:\Users\user\Desktop\ecopria
.\test-echange-api.ps1
```

### 2. Utiliser le Script Bash (Linux/Mac/Git Bash)

```bash
cd /c/Users/user/Desktop/ecopria
chmod +x test-echange-api.sh
./test-echange-api.sh
```

### 3. Test Manuel via cURL

```bash
# 1. Vérifier les points
curl http://localhost:8082/api/utilisateurs/1/points

# 2. Voir les offres
curl http://localhost:8084/api/recompenses

# 3. Échanger contre l'offre ID 1
curl -X POST http://localhost:8084/api/recompenses/echanger \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{"recompenseId": 1}'

# Vous recevrez un code comme : ECO-2026-A7K9M

# 4. Valider le code en tant que partenaire
curl -X POST http://localhost:8084/api/partenaire/valider-coupon \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{"code": "ECO-2026-A7K9M"}'
```

---

## 📋 Checklist de Résolution

- [ ] **1. Vérifier la DB** : L'utilisateur ID 1 a bien 400 points
- [ ] **2. Tester l'API** : GET `/api/utilisateurs/1/points` retourne `{"totalPoints": 400}`
- [ ] **3. Identifier la cause** : Frontend ou Backend ?
- [ ] **4. Corriger le code** : Selon la cause identifiée
- [ ] **5. Tester l'affichage** : L'interface affiche maintenant 400 points
- [ ] **6. Tester l'échange** : Échanger des points contre une offre
- [ ] **7. Vérifier le code** : Un code coupon est généré
- [ ] **8. Tester la validation** : Le partenaire peut scanner et valider le code

---

## 🛠️ Commandes de Dépannage

### Réinitialiser les points de l'utilisateur

```sql
USE db_utilisateur;
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

### Vérifier les services actifs

```bash
# Vérifier que les services sont démarrés
curl http://localhost:8082/actuator/health  # service-utilisateur
curl http://localhost:8084/actuator/health  # service-recompense
curl http://localhost:8080/actuator/health  # api-gateway
```

### Voir les logs des services

```bash
# Si lancés avec Maven
cd backend/service-utilisateur
mvnw spring-boot:run

# Les logs s'afficheront dans la console
# Chercher les lignes avec : GET /api/utilisateurs/1/points
```

### Vérifier la configuration MySQL

```bash
# Se connecter à MySQL
mysql -u ecopria -p -h localhost -P 3307

# Tester la connexion
USE db_utilisateur;
SHOW TABLES;
SELECT COUNT(*) FROM citizens;
```

---

## 🎯 Points Clés à Retenir

1. **authId vs id** : 
   - `auth_id` = identifiant de l'utilisateur authentifié (vient de `db_auth`)
   - `id` = clé primaire de la table `citizens`
   - **Toujours utiliser `auth_id` dans les endpoints API**

2. **Structure de la réponse API** :
   ```json
   {
     "totalPoints": 400  ← Nom exact de la propriété
   }
   ```

3. **Flow complet** :
   ```
   Frontend → API Gateway (8080) → Service-Utilisateur (8082) → MySQL (db_utilisateur)
   ```

4. **Vérifier dans cet ordre** :
   1. Base de données
   2. API Backend directe (port 8082)
   3. API Gateway (port 8080)
   4. Code Frontend

---

## 📚 Fichiers d'Aide Créés

1. **GUIDE-TEST-ECHANGE-POINTS.md** : Guide complet du système d'échange
2. **test-points-echange.sql** : Requêtes SQL pour diagnostic et tests
3. **test-echange-api.ps1** : Script PowerShell automatisé
4. **test-echange-api.sh** : Script Bash automatisé
5. **SOLUTION-PROBLEME-0-POINTS.md** : Ce document

---

## 🆘 Besoin d'Aide ?

Si le problème persiste, fournissez ces informations :

1. **Résultat de la commande** :
   ```bash
   curl http://localhost:8082/api/utilisateurs/1/points
   ```

2. **Résultat de la requête SQL** :
   ```sql
   SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;
   ```

3. **Logs du service-utilisateur** (dernières lignes avec "points")

4. **Code frontend** qui affiche les points (si accessible)

---

**Bonne chance ! 🚀**
