# 🔍 Test Direct de l'API - Sans Modifier le Code

## 🎯 Problème

Le service ne compile pas après ajout des logs. Testons directement l'API sans modifier le code.

---

## ✅ Étape 1 : Démarrer le Service

```powershell
cd C:\Users\user\Desktop\ecopria\backend\service-utilisateur
./mvnw spring-boot:run
```

Le service doit démarrer normalement maintenant (les logs ont été retirés).

---

## ✅ Étape 2 : Tester l'API

### Option A : PowerShell (Windows)

```powershell
# Test 1 : Vérifier que le service répond
Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"

# Test 2 : Récupérer les points de l'user ID 1
$response = Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/points"
Write-Host "Points: $($response.totalPoints)"

# Test 3 : Récupérer le profil complet
$profile = Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/profile"
Write-Host "Nom: $($profile.firstName) $($profile.lastName)"
Write-Host "Points: $($profile.totalPoints)"
```

### Option B : cURL (Git Bash)

```bash
# Test 1 : Health check
curl http://localhost:8082/actuator/health

# Test 2 : Points
curl http://localhost:8082/api/users/1/points

# Test 3 : Profil
curl http://localhost:8082/api/users/1/profile
```

---

## ✅ Étape 3 : Vérifier la Base de Données

```sql
mysql -u ecopria -p -h localhost -P 3307

USE db_utilisateur;

-- Vérifier tous les utilisateurs
SELECT id, auth_id, first_name, last_name, email, total_points 
FROM citizens;

-- Vérifier l'user ID 1 spécifiquement
SELECT * FROM citizens WHERE auth_id = 1;
```

---

## 🔧 Actions selon le Résultat

### CAS 1 : API retourne 400 points ✅

```json
{
  "totalPoints": 400
}
```

**→ Le backend fonctionne !**

**Problème = Frontend**

Testez le frontend :
1. Ouvrir `http://localhost:4200/partenaires/2`
2. F12 → Console
3. Vérifier les logs frontend

### CAS 2 : API retourne 0 points ❌

```json
{
  "totalPoints": 0
}
```

**→ Le backend fonctionne mais les points sont à 0 dans la DB**

**Solution :**
```sql
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

### CAS 3 : API retourne une erreur ❌

```json
{
  "message": "Citoyen non trouvé"
}
```

**→ Aucun utilisateur avec auth_id = 1**

**Solution :**
```sql
-- Vérifier qui existe
SELECT id, auth_id, first_name, last_name FROM citizens;

-- Option A : Créer l'user
INSERT INTO citizens (auth_id, last_name, first_name, email, total_points, trust_score, created_at)
VALUES (1, 'Doe', 'John', 'john@example.com', 400, 100, NOW());

-- Option B : Modifier un existant
UPDATE citizens SET auth_id = 1, total_points = 400 WHERE id = 1;
```

---

## 🚀 Script de Test Automatique

Créez un fichier `test-api-simple.ps1` :

```powershell
Write-Host "Test de l'API Backend" -ForegroundColor Cyan
Write-Host ""

# Test 1 : Health
Write-Host "1. Health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   Erreur: Service non accessible" -ForegroundColor Red
    exit 1
}

# Test 2 : Points
Write-Host "2. Récupération des points..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/points"
    $points = $response.totalPoints
    Write-Host "   Points: $points" -ForegroundColor Green
    
    if ($points -eq 0) {
        Write-Host "   ATTENTION: Points à 0!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Erreur: $_" -ForegroundColor Red
}

# Test 3 : Profil
Write-Host "3. Récupération du profil..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/profile"
    Write-Host "   Nom: $($profile.firstName) $($profile.lastName)" -ForegroundColor Green
    Write-Host "   Email: $($profile.email)" -ForegroundColor Green
    Write-Host "   Points: $($profile.totalPoints)" -ForegroundColor Green
} catch {
    Write-Host "   Erreur: $_" -ForegroundColor Red
}
```

Exécutez :
```powershell
.\test-api-simple.ps1
```

---

## 📊 Diagnostic Complet

| Test | Résultat | Signification | Action |
|------|----------|---------------|--------|
| Health check | ✅ UP | Service actif | Continuer |
| Health check | ❌ Erreur | Service arrêté | Démarrer service |
| Points API | 400 | Backend OK | Tester frontend |
| Points API | 0 | DB à 0 | UPDATE total_points |
| Points API | Erreur | User absent | INSERT ou UPDATE auth_id |

---

## 🎯 Résumé en 3 Commandes

```powershell
# 1. Health check
Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"

# 2. Récupérer les points
(Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/points").totalPoints

# 3. Si 0, vérifier la DB
# mysql -u ecopria -p -h localhost -P 3307
# USE db_utilisateur;
# SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;
```

---

## ✅ Une Fois le Backend Validé

Si l'API retourne bien 400 points mais le frontend affiche toujours 0 :

**→ Le problème est dans le frontend**

Tests frontend :
1. F12 → Console
2. Vérifier : `localStorage.getItem('ecopria_user_id')`
3. Tester : `fetch('/api/users/1/points').then(r => r.json()).then(d => console.log(d))`

---

**Commencez par démarrer le service et tester avec PowerShell !**
