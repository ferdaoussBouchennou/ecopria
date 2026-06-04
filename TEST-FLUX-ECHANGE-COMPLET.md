# 🎯 TEST COMPLET DU FLUX D'ÉCHANGE DE POINTS

## 📋 PROBLÈME IDENTIFIÉ

Lorsque le partenaire essaie de valider un code coupon, l'erreur "Une erreur inattendue est survenue" apparaît.

### Causes possibles:
1. ❌ Le service-recompense n'est pas démarré → ✅ **RÉSOLU** (service sur port 9093)
2. ❌ Le partenaire n'existe pas dans db_recompense
3. ❌ Le header X-User-Id n'est pas envoyé correctement
4. ❌ Le code coupon n'existe pas
5. ❌ Problème de CORS

---

## 🔍 ÉTAPE 1: Vérifier que les services sont démarrés

```powershell
# Service-Utilisateur (port 8082)
curl.exe http://localhost:8082/api/users/1/points

# Service-Recompense (port 9093)
curl.exe http://localhost:9093/api/recompenses

# Résultat attendu:
# - Service-Utilisateur: {"totalPoints":400}
# - Service-Recompense: [liste des récompenses]
```

---

## 🔍 ÉTAPE 2: Vérifier les données dans la base

### A. Vérifier que le citoyen a des points

```sql
-- Connexion à MySQL
mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026

USE db_utilisateur;

-- Vérifier les points du citoyen
SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;
-- Résultat attendu: 400 points
```

### B. Vérifier que le partenaire existe

```sql
USE db_recompense;

-- Lister tous les partenaires
SELECT id, user_id, name, category FROM partenaire;

-- Si aucun partenaire n'existe, en créer un:
INSERT INTO partenaire (
    user_id, name, category, address, city, 
    description, image_url, phone, commission_rate,
    vues_profil, clics_offres
) VALUES (
    3, 'Partenaire Test', 'COMMERCE_LOCAL', 
    '123 Rue Test', 'Casablanca',
    'Partenaire de test pour validation', 
    NULL, '0600000000', 10.0,
    0, 0
);
```

### C. Vérifier qu'il y a des récompenses

```sql
-- Lister les récompenses disponibles
SELECT 
    r.id, r.title, r.points_necessaires, r.type, 
    r.is_active, p.name as partenaire_name
FROM recompense r
JOIN partenaire p ON r.partenaire_id = p.id
WHERE r.is_active = true;

-- Si aucune récompense, en créer une:
INSERT INTO recompense (
    partenaire_id, title, description, image_url,
    points_necessaires, type, is_active, 
    discount_percentage, valeur_dh
) VALUES (
    1, 'Réduction 20%', 'Test réduction', NULL,
    100, 'REDUCTION', true,
    20, 50
);
```

---

## 🔍 ÉTAPE 3: Tester l'échange de points (CITOYEN)

### Via curl:

```powershell
# Échanger des points pour obtenir un coupon
$body = '{"recompenseId": 1}'
$headers = @{'X-User-Id' = '1'; 'Content-Type' = 'application/json'}

Invoke-RestMethod -Uri "http://localhost:9093/api/recompenses/echanger" `
  -Method POST `
  -Headers $headers `
  -Body $body

# Résultat attendu:
# {
#   "id": 1,
#   "code": "ECO-2026-XXXXX",
#   "recompenseTitle": "Réduction 20%",
#   "pointsUtilises": 100,
#   "status": "DISTRIBUE",
#   ...
# }
```

### Via frontend:
1. Connectez-vous en tant que citoyen (ID 1)
2. Allez sur la page d'un partenaire
3. Cliquez sur "Échanger" pour une offre
4. **Notez le code coupon généré** (ex: ECO-2026-ABCDE)

---

## 🔍 ÉTAPE 4: Vérifier que le coupon a été créé

```sql
USE db_recompense;

-- Vérifier les coupons générés
SELECT 
    c.id, c.code, c.user_id, c.status,
    c.points_utilises, c.created_at,
    r.title as recompense_title,
    p.name as partenaire_name
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
ORDER BY c.created_at DESC
LIMIT 5;
```

---

## 🔍 ÉTAPE 5: Vérifier que les points ont été déduits

```sql
USE db_utilisateur;

-- Vérifier le nouveau solde
SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;
-- Si l'échange a fonctionné: 400 - 100 = 300 points
```

---

## 🔍 ÉTAPE 6: Tester la validation du coupon (PARTENAIRE)

### A. Identifier l'ID utilisateur du partenaire

```sql
USE db_recompense;

-- Récupérer le user_id du partenaire
SELECT id, user_id, name FROM partenaire;
-- Noter le user_id (ex: 3)
```

### B. Tester via curl:

```powershell
# Valider un coupon
$code = "ECO-2026-XXXXX"  # Remplacer par le vrai code
$body = "{`"code`": `"$code`"}"
$headers = @{'X-User-Id' = '3'; 'Content-Type' = 'application/json'}

Invoke-RestMethod -Uri "http://localhost:9093/api/partenaire/valider-coupon" `
  -Method POST `
  -Headers $headers `
  -Body $body

# Résultat attendu:
# {
#   "id": 1,
#   "code": "ECO-2026-XXXXX",
#   "status": "UTILISE",
#   "valideLe": "2026-06-04T...",
#   ...
# }
```

### C. Vérifier les erreurs possibles:

Si erreur **"Coupon introuvable"**:
- Le code n'existe pas dans la base
- Vérifiez avec: `SELECT * FROM coupon WHERE code = 'ECO-2026-XXXXX';`

Si erreur **"Ce coupon n'appartient pas à votre enseigne"**:
- Le coupon appartient à un autre partenaire
- Vérifiez: 
  ```sql
  SELECT c.code, r.partenaire_id, p.name
  FROM coupon c
  JOIN recompense r ON c.recompense_id = r.id
  JOIN partenaire p ON r.partenaire_id = p.id
  WHERE c.code = 'ECO-2026-XXXXX';
  ```

Si erreur **"Ce coupon a déjà été utilisé"**:
- Le coupon a déjà été validé
- Vérifiez: `SELECT status FROM coupon WHERE code = 'ECO-2026-XXXXX';`

Si erreur **"Partenaire non trouvé"**:
- Le user_id du header ne correspond à aucun partenaire
- Créez un partenaire avec ce user_id

---

## 🔍 ÉTAPE 7: Déboguer le frontend

### A. Vérifier le DevContextService

Le service Angular `dev-context.service.ts` retourne le `userId` du partenaire pour les headers.

```typescript
// Dans partenaire.service.ts
private get userId(): number {
  return this.devContext.getPartenaireUserId();
}
```

Vérifiez dans la console du navigateur (F12):
```javascript
// Dans la console
localStorage.getItem('ecopria_user_id')
localStorage.getItem('ecopria_role')
```

### B. Vérifier que le header est envoyé

Dans la console Network (F12):
1. Cliquez sur la requête `valider-coupon`
2. Onglet "Headers"
3. Vérifiez que `X-User-Id` est présent

---

## 🎯 SCRIPT DE TEST AUTOMATIQUE

Créez le fichier `test-flux-echange.ps1`:

```powershell
# Configuration
$USER_CITOYEN_ID = 1
$USER_PARTENAIRE_ID = 3
$RECOMPENSE_ID = 1

Write-Host "`n=== TEST FLUX ÉCHANGE DE POINTS ===" -ForegroundColor Cyan

# 1. Vérifier le solde initial
Write-Host "`n[1] Solde initial du citoyen..." -ForegroundColor Yellow
$soldeAvant = (Invoke-RestMethod "http://localhost:8082/api/users/$USER_CITOYEN_ID/points").totalPoints
Write-Host "   Solde: $soldeAvant points" -ForegroundColor Green

# 2. Échanger des points
Write-Host "`n[2] Échange de points..." -ForegroundColor Yellow
$body = "{`"recompenseId`": $RECOMPENSE_ID}"
$headers = @{'X-User-Id' = "$USER_CITOYEN_ID"; 'Content-Type' = 'application/json'}
try {
    $coupon = Invoke-RestMethod -Uri "http://localhost:9093/api/recompenses/echanger" `
      -Method POST -Headers $headers -Body $body
    Write-Host "   [OK] Coupon généré: $($coupon.code)" -ForegroundColor Green
    Write-Host "   Points utilisés: $($coupon.pointsUtilises)" -ForegroundColor Cyan
    $codeCoupon = $coupon.code
} catch {
    Write-Host "   [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Vérifier le nouveau solde
Write-Host "`n[3] Vérification du nouveau solde..." -ForegroundColor Yellow
$soldeApres = (Invoke-RestMethod "http://localhost:8082/api/users/$USER_CITOYEN_ID/points").totalPoints
Write-Host "   Nouveau solde: $soldeApres points" -ForegroundColor Green
Write-Host "   Différence: $($soldeAvant - $soldeApres) points" -ForegroundColor Cyan

# 4. Valider le coupon (PARTENAIRE)
Write-Host "`n[4] Validation du coupon par le partenaire..." -ForegroundColor Yellow
$body = "{`"code`": `"$codeCoupon`"}"
$headers = @{'X-User-Id' = "$USER_PARTENAIRE_ID"; 'Content-Type' = 'application/json'}
try {
    $validation = Invoke-RestMethod -Uri "http://localhost:9093/api/partenaire/valider-coupon" `
      -Method POST -Headers $headers -Body $body
    Write-Host "   [OK] Coupon validé!" -ForegroundColor Green
    Write-Host "   Status: $($validation.status)" -ForegroundColor Cyan
    Write-Host "   Validé le: $($validation.valideLe)" -ForegroundColor Cyan
} catch {
    Write-Host "   [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== TEST RÉUSSI ===" -ForegroundColor Green
```

---

## 🚀 SOLUTION RAPIDE

Si vous voulez tester rapidement, exécutez ces commandes:

```powershell
# 1. Vérifier les services
curl.exe http://localhost:8082/api/users/1/points
curl.exe http://localhost:9093/api/recompenses

# 2. Si le service-recompense ne répond pas, vérifier le processus Java:
Get-Process java | Select-Object Id, CPU, WS
# Si besoin, redémarrer le service

# 3. Créer un partenaire de test si nécessaire
# Voir script SQL dans ÉTAPE 2.B

# 4. Tester l'échange et la validation
# Utiliser le script PowerShell ci-dessus
```

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Service-Utilisateur fonctionne (port 8082)
- [ ] Service-Recompense fonctionne (port 9093)
- [ ] Le citoyen a des points (SELECT total_points FROM citizens)
- [ ] Un partenaire existe (SELECT * FROM partenaire)
- [ ] Des récompenses sont disponibles (SELECT * FROM recompense WHERE is_active=true)
- [ ] L'échange génère un coupon (POST /echanger)
- [ ] Les points sont déduits automatiquement
- [ ] Le coupon peut être validé (POST /valider-coupon)
- [ ] Le statut passe à UTILISE
- [ ] Les commissions sont calculées

---

## 📝 PROCHAINES ÉTAPES

Après avoir résolu le problème de validation:

1. **Ajouter le QR Code**:
   - Installer une librairie Angular: `npm install qrcode`
   - Générer le QR code avec le code coupon
   - Afficher dans le modal après échange

2. **Améliorer le scanner**:
   - Ajouter un vrai scanner QR (caméra)
   - Ou garder la saisie manuelle

3. **Notifications**:
   - Email au citoyen avec le coupon
   - Email au partenaire après validation

---

**Créé le**: 2026-06-04  
**Statut**: En cours de débogage
