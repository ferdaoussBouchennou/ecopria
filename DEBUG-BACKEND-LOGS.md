# 🔍 Guide de Débogage Backend - Points

## 📋 Logs Ajoutés au Backend

Des logs ont été ajoutés pour tracer le flux complet de récupération des points.

---

## 🎯 Comment Voir les Logs

### 1. Dans le Terminal où Service-Utilisateur est Lancé

Les logs s'affichent dans le terminal où vous avez exécuté :
```bash
cd backend/service-utilisateur
mvnw spring-boot:run
```

### 2. Flux des Logs Attendus

Quand vous appelez `GET /api/users/1/points`, vous devriez voir :

```
🔍 [UserController] GET /api/users/1/points
🔍 [UserController] Recherche citoyen avec authId: 1
🔍 [UserService] getTotalPoints appelé avec authId: 1
🔍 [UserService] getCitizen appelé avec authId: 1
✅ [UserService] Citoyen trouvé: John Doe (auth_id=1, total_points=400)
✅ [UserService] Points du citoyen John Doe: 400
✅ [UserController] Points trouvés: 400
```

---

## 🔍 Interprétation des Logs

### ✅ Scénario Normal (Tout Fonctionne)

```
🔍 [UserController] GET /api/users/1/points
🔍 [UserController] Recherche citoyen avec authId: 1
🔍 [UserService] getTotalPoints appelé avec authId: 1
🔍 [UserService] getCitizen appelé avec authId: 1
✅ [UserService] Citoyen trouvé: John Doe (auth_id=1, total_points=400)
✅ [UserService] Points du citoyen John Doe: 400
✅ [UserController] Points trouvés: 400
```

**→ Le backend fonctionne correctement**  
**→ Si le frontend affiche toujours 0, le problème est dans le frontend ou le routing**

---

### ❌ Scénario 1 : Utilisateur Non Trouvé

```
🔍 [UserController] GET /api/users/1/points
🔍 [UserController] Recherche citoyen avec authId: 1
🔍 [UserService] getTotalPoints appelé avec authId: 1
🔍 [UserService] getCitizen appelé avec authId: 1
❌ [UserService] Aucun citoyen trouvé avec authId: 1
❌ [UserController] Erreur: Citoyen non trouvé
```

**Cause :** Aucun citoyen avec `auth_id = 1` dans la base

**Solution :**
```sql
-- Vérifier
SELECT * FROM citizens WHERE auth_id = 1;

-- Si vide, créer l'utilisateur ou mettre à jour un existant
UPDATE citizens SET auth_id = 1 WHERE id = 1;
```

---

### ⚠️ Scénario 2 : Points à NULL ou 0

```
🔍 [UserController] GET /api/users/1/points
🔍 [UserController] Recherche citoyen avec authId: 1
🔍 [UserService] getTotalPoints appelé avec authId: 1
🔍 [UserService] getCitizen appelé avec authId: 1
✅ [UserService] Citoyen trouvé: John Doe (auth_id=1, total_points=null)
✅ [UserService] Points du citoyen John Doe: 0
✅ [UserController] Points trouvés: 0
```

ou

```
✅ [UserService] Citoyen trouvé: John Doe (auth_id=1, total_points=0)
✅ [UserService] Points du citoyen John Doe: 0
```

**Cause :** La colonne `total_points` est à 0 ou NULL dans la base

**Solution :**
```sql
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

---

### 🔀 Scénario 3 : Mauvais ID Appelé

```
🔍 [UserController] GET /api/users/2/points
🔍 [UserController] Recherche citoyen avec authId: 2
🔍 [UserService] getTotalPoints appelé avec authId: 2
🔍 [UserService] getCitizen appelé avec authId: 2
✅ [UserService] Citoyen trouvé: Jane Smith (auth_id=2, total_points=0)
✅ [UserService] Points du citoyen Jane Smith: 0
✅ [UserController] Points trouvé: 0
```

**Cause :** Le frontend appelle avec un mauvais ID (2 au lieu de 1)

**Solution Frontend :**
```javascript
// Vérifier dans la console du navigateur
localStorage.getItem('ecopria_user_id')
// Doit retourner "1"
```

**Solution Alternative :**
```sql
-- Mettre à jour les points de l'utilisateur 2
UPDATE citizens SET total_points = 400 WHERE auth_id = 2;
```

---

## 🧪 Tests à Effectuer

### Test 1 : Script Automatique

```powershell
.\test-backend-points.ps1
```

Ce script :
- ✅ Vérifie que le service est actif
- ✅ Appelle l'API `/api/users/1/points`
- ✅ Affiche la réponse complète
- ✅ Récupère le profil et le dashboard

---

### Test 2 : cURL Manuel

```bash
# Test simple
curl http://localhost:8082/api/users/1/points

# Test verbose avec headers
curl -v http://localhost:8082/api/users/1/points
```

**Réponse attendue :**
```json
{
  "totalPoints": 400
}
```

---

### Test 3 : Vérifier la Base de Données

```sql
mysql -u ecopria -p -h localhost -P 3307

USE db_utilisateur;

-- Vérifier l'utilisateur
SELECT 
    id,
    auth_id,
    first_name,
    last_name,
    email,
    total_points,
    trust_score,
    created_at
FROM citizens 
WHERE auth_id = 1;
```

**Résultat attendu :**
```
+----+---------+------------+-----------+------------------+--------------+-------------+
| id | auth_id | first_name | last_name | email            | total_points | trust_score |
+----+---------+------------+-----------+------------------+--------------+-------------+
|  1 |       1 | John       | Doe       | john@example.com |          400 |         100 |
+----+---------+------------+-----------+------------------+--------------+-------------+
```

---

## 🔧 Actions Correctives

### Action 1 : Créer/Mettre à Jour les Points

```sql
USE db_utilisateur;

-- Si l'utilisateur existe mais total_points est à 0 ou NULL
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;

-- Vérifier
SELECT auth_id, first_name, last_name, total_points 
FROM citizens 
WHERE auth_id = 1;
```

---

### Action 2 : Créer l'Utilisateur s'il N'Existe Pas

```sql
USE db_utilisateur;

-- Vérifier d'abord
SELECT * FROM citizens WHERE auth_id = 1;

-- Si vide, créer (adapter les valeurs)
INSERT INTO citizens (
    auth_id,
    last_name,
    first_name,
    email,
    total_points,
    trust_score,
    created_at
) VALUES (
    1,
    'Doe',
    'John',
    'john@example.com',
    400,
    100,
    NOW()
);
```

---

### Action 3 : Relancer le Service avec Logs

```bash
# Arrêter le service actuel (Ctrl+C)

# Relancer
cd backend/service-utilisateur
mvnw spring-boot:run

# Les logs s'afficheront maintenant dans ce terminal
```

---

## 📊 Matrice de Diagnostic

| Logs Backend | Points API | Diagnostic | Solution |
|--------------|------------|------------|----------|
| ✅ Points: 400 | 400 | Backend OK | Problème frontend |
| ✅ Points: 0 | 0 | DB à 0 | UPDATE total_points |
| ❌ User not found | Erreur 500 | User absent | INSERT ou UPDATE auth_id |
| Pas de logs | Erreur connexion | Service arrêté | Démarrer service |

---

## 🎯 Checklist de Vérification

- [ ] Le service-utilisateur est démarré
- [ ] Les logs s'affichent dans le terminal
- [ ] La requête GET /api/users/1/points arrive au backend
- [ ] Le log montre `authId: 1`
- [ ] Le citoyen est trouvé dans la DB
- [ ] `total_points` n'est pas NULL ou 0
- [ ] Le backend retourne `{"totalPoints": 400}`

---

## 🔄 Flux Complet avec Logs

```
1. Frontend appelle: GET /api/users/1/points
   ↓
2. [BACKEND LOG] 🔍 [UserController] GET /api/users/1/points
   ↓
3. [BACKEND LOG] 🔍 [UserController] Recherche citoyen avec authId: 1
   ↓
4. UserService.getTotalPoints(1)
   ↓
5. [BACKEND LOG] 🔍 [UserService] getTotalPoints appelé avec authId: 1
   ↓
6. UserService.getCitizen(1)
   ↓
7. [BACKEND LOG] 🔍 [UserService] getCitizen appelé avec authId: 1
   ↓
8. citizenRepository.findByAuthId(1)
   ↓
9. [SQL QUERY] SELECT * FROM citizens WHERE auth_id = 1
   ↓
10. [BACKEND LOG] ✅ Citoyen trouvé: John Doe (total_points=400)
    ↓
11. [BACKEND LOG] ✅ Points du citoyen John Doe: 400
    ↓
12. [BACKEND LOG] ✅ Points trouvés: 400
    ↓
13. Backend retourne: {"totalPoints": 400}
    ↓
14. Frontend reçoit la réponse
    ↓
15. [FRONTEND LOG] ✅ Réponse API reçue: {totalPoints: 400}
    ↓
16. soldePoints = 400
    ↓
17. [FRONTEND LOG] 💰 Solde de points assigné: 400 points
    ↓
18. Interface affiche: "400 points"
```

---

## 🆘 Si les Logs Ne S'Affichent Pas

### Cause 1 : Service Non Redémarré

```bash
# Arrêter le service
Ctrl+C

# Relancer
cd backend/service-utilisateur
mvnw spring-boot:run
```

### Cause 2 : Logs Désactivés

Vérifier `application.yml` :
```yaml
logging:
  level:
    com.ecopria: DEBUG
```

---

## ✅ Résumé

1. **Exécuter** `.\test-backend-points.ps1`
2. **Observer** les logs dans le terminal du service-utilisateur
3. **Identifier** le scénario (voir ci-dessus)
4. **Appliquer** la solution correspondante
5. **Retester** avec le script

**Une fois le backend confirmé OK, si le problème persiste, c'est le frontend !**

---

**Prochaine étape après résolution backend :** Tester le frontend avec F12 → Console
