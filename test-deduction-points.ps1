# Script de test de la déduction automatique des points

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST DÉDUCTION AUTOMATIQUE DES POINTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$BASE_URL_UTILISATEUR = "http://localhost:8082"
$BASE_URL_RECOMPENSE = "http://localhost:9093"
$USER_CITOYEN_ID = 1
$RECOMPENSE_ID = 1

# Étape 1: Vérifier le solde AVANT échange
Write-Host "[1/5] Vérification du solde AVANT échange..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL_UTILISATEUR/api/users/$USER_CITOYEN_ID/points" -Method Get
    $pointsAvant = $response.totalPoints
    Write-Host "  Solde AVANT: $pointsAvant points" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: Service-Utilisateur non accessible" -ForegroundColor Red
    Write-Host "  Vérifiez que le service tourne sur le port 8082" -ForegroundColor Yellow
    exit 1
}

# Étape 2: Vérifier la récompense
Write-Host "`n[2/5] Vérification de la récompense..." -ForegroundColor Yellow
try {
    $recompense = Invoke-RestMethod -Uri "$BASE_URL_RECOMPENSE/api/recompenses/$RECOMPENSE_ID" -Method Get
    $pointsRequis = $recompense.pointsNecessaires
    Write-Host "  Récompense: $($recompense.title)" -ForegroundColor Green
    Write-Host "  Points requis: $pointsRequis" -ForegroundColor Green
    
    if ($pointsAvant -lt $pointsRequis) {
        Write-Host "  ATTENTION: Pas assez de points!" -ForegroundColor Red
        Write-Host "  Solde: $pointsAvant - Requis: $pointsRequis" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ERREUR: Service-Recompense non accessible" -ForegroundColor Red
    exit 1
}

# Étape 3: Effectuer l'échange
Write-Host "`n[3/5] Échange de la récompense..." -ForegroundColor Yellow
try {
    $body = @{
        citoyenAuthId = $USER_CITOYEN_ID
        recompenseId = $RECOMPENSE_ID
    } | ConvertTo-Json

    $coupon = Invoke-RestMethod -Uri "$BASE_URL_RECOMPENSE/api/recompenses/echanger" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  ✅ Coupon généré: $($coupon.code)" -ForegroundColor Green
    Write-Host "  Points utilisés: $($coupon.pointsUtilises)" -ForegroundColor Cyan
} catch {
    Write-Host "  ERREUR: Échec de l'échange" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 4: Vérifier le solde APRÈS échange
Write-Host "`n[4/5] Vérification du solde APRÈS échange..." -ForegroundColor Yellow
Start-Sleep -Seconds 1  # Attendre 1 seconde pour la BD
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL_UTILISATEUR/api/users/$USER_CITOYEN_ID/points" -Method Get
    $pointsApres = $response.totalPoints
    Write-Host "  Solde APRÈS: $pointsApres points" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: Impossible de récupérer le nouveau solde" -ForegroundColor Red
    exit 1
}

# Étape 5: Vérifier que les points ont bien été déduits
Write-Host "`n[5/5] Vérification de la déduction..." -ForegroundColor Yellow
$pointsDeduits = $pointsAvant - $pointsApres
$deductionAtttendue = $pointsRequis

Write-Host "`n  Solde AVANT:    $pointsAvant points" -ForegroundColor Cyan
Write-Host "  Points requis:  $pointsRequis points" -ForegroundColor Cyan
Write-Host "  Solde APRÈS:    $pointsApres points" -ForegroundColor Cyan
Write-Host "  Déduits:        $pointsDeduits points`n" -ForegroundColor Cyan

if ($pointsDeduits -eq $deductionAtttendue) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ TEST RÉUSSI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nLes points ont été correctement déduits!" -ForegroundColor Green
    Write-Host "Déduction: $pointsDeduits points (attendu: $deductionAtttendue)" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ TEST ÉCHOUÉ!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "`nLes points n'ont pas été correctement déduits!" -ForegroundColor Red
    Write-Host "Déduction attendue: $deductionAtttendue" -ForegroundColor Red
    Write-Host "Déduction réelle: $pointsDeduits" -ForegroundColor Red
    exit 1
}

# Vérifier l'historique
Write-Host "`n[BONUS] Vérification de l'historique..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$BASE_URL_UTILISATEUR/api/users/$USER_CITOYEN_ID/history" -Method Get
    $derniereEntree = $history[0]
    if ($derniereEntree.points -eq -$pointsRequis) {
        Write-Host "  ✅ Entrée dans l'historique créée" -ForegroundColor Green
        Write-Host "  Points: $($derniereEntree.points)" -ForegroundColor Cyan
        Write-Host "  Description: $($derniereEntree.description)" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️ Pas d'entrée d'historique trouvée" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️ Impossible de vérifier l'historique" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
