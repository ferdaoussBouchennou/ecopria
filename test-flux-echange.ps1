# Script de test complet du flux d'échange de points
# Teste: Échange → Déduction points → Validation coupon

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST FLUX ECHANGE DE POINTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$USER_CITOYEN_ID = 1
$USER_PARTENAIRE_ID = 1  # Café Botanique (user_id=1)
$RECOMPENSE_ID = 1        # Café & pâtisserie - 150 points

# Étape 0: Vérifier que les services répondent
Write-Host "[0] Vérification des services..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod "http://localhost:8082/api/users/1/points" -ErrorAction Stop
    Write-Host "  [OK] Service-Utilisateur (8082)" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Service-Utilisateur non accessible" -ForegroundColor Red
    Write-Host "  Démarrez: docker start ecopria-utilisateur" -ForegroundColor Yellow
    exit 1
}

try {
    $null = Invoke-RestMethod "http://localhost:9093/api/recompenses" -ErrorAction Stop
    Write-Host "  [OK] Service-Recompense (9093)" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Service-Recompense non accessible" -ForegroundColor Red
    Write-Host "  Le processus Java devrait être sur le port 9093" -ForegroundColor Yellow
    exit 1
}

# Étape 1: Vérifier le solde initial
Write-Host "`n[1] Solde initial du citoyen..." -ForegroundColor Yellow
try {
    $soldeAvant = (Invoke-RestMethod "http://localhost:8082/api/users/$USER_CITOYEN_ID/points").totalPoints
    Write-Host "  Citoyen ID $USER_CITOYEN_ID : $soldeAvant points" -ForegroundColor Green
} catch {
    Write-Host "  [ERREUR] Impossible de récupérer le solde" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor DarkGray
    exit 1
}

# Étape 2: Échanger des points
Write-Host "`n[2] Échange de points..." -ForegroundColor Yellow
$bodyEchange = @{
    recompenseId = $RECOMPENSE_ID
} | ConvertTo-Json

$headersEchange = @{
    'X-User-Id' = "$USER_CITOYEN_ID"
    'Content-Type' = 'application/json'
}

try {
    $coupon = Invoke-RestMethod -Uri "http://localhost:9093/api/recompenses/echanger" `
      -Method POST `
      -Headers $headersEchange `
      -Body $bodyEchange `
      -ErrorAction Stop
    
    Write-Host "  [OK] Coupon généré!" -ForegroundColor Green
    Write-Host "  Code: $($coupon.code)" -ForegroundColor Cyan
    Write-Host "  Offre: $($coupon.recompenseTitle)" -ForegroundColor Cyan
    Write-Host "  Points utilisés: $($coupon.pointsUtilises)" -ForegroundColor Cyan
    $codeCoupon = $coupon.code
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails.message) {
            $errorMsg = $errorDetails.message
        }
    }
    Write-Host "  [ERREUR] Échec de l'échange" -ForegroundColor Red
    Write-Host "  Message: $errorMsg" -ForegroundColor DarkRed
    
    if ($errorMsg -like "*Points insuffisants*") {
        Write-Host "`n  Solution: Ajoutez des points au citoyen" -ForegroundColor Yellow
        Write-Host "  SQL: UPDATE citizens SET total_points = 500 WHERE auth_id = $USER_CITOYEN_ID;" -ForegroundColor Cyan
    } elseif ($errorMsg -like "*non trouvée*") {
        Write-Host "`n  Solution: Vérifiez que la récompense ID $RECOMPENSE_ID existe" -ForegroundColor Yellow
        Write-Host "  SQL: SELECT * FROM recompense WHERE id = $RECOMPENSE_ID;" -ForegroundColor Cyan
    }
    exit 1
}

# Étape 3: Vérifier le nouveau solde
Write-Host "`n[3] Vérification du nouveau solde..." -ForegroundColor Yellow
Start-Sleep -Seconds 2  # Attendre que Kafka traite l'événement
try {
    $soldeApres = (Invoke-RestMethod "http://localhost:8082/api/users/$USER_CITOYEN_ID/points").totalPoints
    $difference = $soldeAvant - $soldeApres
    Write-Host "  Solde avant: $soldeAvant points" -ForegroundColor Cyan
    Write-Host "  Solde après: $soldeApres points" -ForegroundColor Cyan
    Write-Host "  Déduit: $difference points" -ForegroundColor $(if ($difference -gt 0) { "Green" } else { "Red" })
    
    if ($difference -le 0) {
        Write-Host "  [ATTENTION] Les points n'ont pas été déduits!" -ForegroundColor Yellow
        Write-Host "  Vérifiez que Kafka fonctionne et que le consumer est actif" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERREUR] Impossible de vérifier le solde" -ForegroundColor Red
}

# Étape 4: Valider le coupon (PARTENAIRE)
Write-Host "`n[4] Validation du coupon par le partenaire..." -ForegroundColor Yellow
Write-Host "  Partenaire user_id: $USER_PARTENAIRE_ID" -ForegroundColor DarkGray
Write-Host "  Code coupon: $codeCoupon" -ForegroundColor DarkGray

$bodyValidation = @{
    code = $codeCoupon
} | ConvertTo-Json

$headersValidation = @{
    'X-User-Id' = "$USER_PARTENAIRE_ID"
    'Content-Type' = 'application/json'
}

try {
    $validation = Invoke-RestMethod -Uri "http://localhost:9093/api/partenaire/valider-coupon" `
      -Method POST `
      -Headers $headersValidation `
      -Body $bodyValidation `
      -ErrorAction Stop
    
    Write-Host "  [OK] Coupon validé avec succès!" -ForegroundColor Green
    Write-Host "  Code: $($validation.code)" -ForegroundColor Cyan
    Write-Host "  Statut: $($validation.status)" -ForegroundColor Cyan
    Write-Host "  Validé le: $($validation.valideLe)" -ForegroundColor Cyan
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails.message) {
            $errorMsg = $errorDetails.message
        }
    }
    Write-Host "  [ERREUR] Échec de la validation" -ForegroundColor Red
    Write-Host "  Message: $errorMsg" -ForegroundColor DarkRed
    
    if ($errorMsg -like "*Partenaire non trouvé*") {
        Write-Host "`n  PROBLÈME IDENTIFIÉ: Le partenaire n'existe pas!" -ForegroundColor Yellow
        Write-Host "  Solution: Créer un partenaire avec user_id = $USER_PARTENAIRE_ID" -ForegroundColor Yellow
        Write-Host "`n  SQL à exécuter:" -ForegroundColor Cyan
        Write-Host @"
  USE db_recompense;
  
  INSERT INTO partenaire (
      user_id, name, category, address, city, 
      description, phone, commission_rate,
      vues_profil, clics_offres
  ) VALUES (
      $USER_PARTENAIRE_ID, 'Partenaire Test', 'COMMERCE_LOCAL', 
      '123 Rue Test', 'Casablanca',
      'Partenaire de test', '0600000000', 10.0,
      0, 0
  );
"@ -ForegroundColor White
    } elseif ($errorMsg -like "*n'appartient pas à votre enseigne*") {
        Write-Host "`n  PROBLÈME: Le coupon appartient à un autre partenaire" -ForegroundColor Yellow
        Write-Host "  Vérifiez quel partenaire possède cette récompense" -ForegroundColor Yellow
    } elseif ($errorMsg -like "*déjà été utilisé*") {
        Write-Host "`n  PROBLÈME: Ce coupon a déjà été validé" -ForegroundColor Yellow
    } elseif ($errorMsg -like "*expiré*") {
        Write-Host "`n  PROBLÈME: Ce coupon est expiré" -ForegroundColor Yellow
    }
    exit 1
}

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ DU TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  [OK] Échange de points" -ForegroundColor Green
Write-Host "  [OK] Génération du coupon: $codeCoupon" -ForegroundColor Green
Write-Host "  [OK] Déduction des points: $soldeAvant → $soldeApres" -ForegroundColor Green
Write-Host "  [OK] Validation du coupon par le partenaire" -ForegroundColor Green
Write-Host "`n  FLUX COMPLET RÉUSSI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
