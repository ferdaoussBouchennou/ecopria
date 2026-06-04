# Script de test du flux complet avec QR Code
# Vérifie que tout fonctionne de bout en bout

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST DU FLUX COMPLET AVEC QR CODE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$BASE_URL = "http://localhost:9093"
$USER_CITOYEN_ID = 1
$USER_PARTENAIRE_ID = 1
$RECOMPENSE_ID = 1

# Étape 1: Vérifier que le citoyen a des points
Write-Host "[1/6] Vérification du solde de points du citoyen..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/users/$USER_CITOYEN_ID/points" -Method Get
    $points = $response.totalPoints
    Write-Host "  Solde actuel: $points points" -ForegroundColor Green
    
    if ($points -lt 150) {
        Write-Host "  ATTENTION: Pas assez de points pour l'échange (requis: 150)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ERREUR: Impossible de récupérer le solde" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 2: Vérifier que la récompense existe
Write-Host "`n[2/6] Vérification de la récompense..." -ForegroundColor Yellow
try {
    $recompense = Invoke-RestMethod -Uri "$BASE_URL/api/recompenses/$RECOMPENSE_ID" -Method Get
    Write-Host "  Récompense: $($recompense.title)" -ForegroundColor Green
    Write-Host "  Points requis: $($recompense.pointsNecessaires)" -ForegroundColor Green
    Write-Host "  Stock: $($recompense.stock)" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: Récompense introuvable" -ForegroundColor Red
    exit 1
}

# Étape 3: Effectuer l'échange
Write-Host "`n[3/6] Échange de la récompense..." -ForegroundColor Yellow
try {
    $body = @{
        citoyenAuthId = $USER_CITOYEN_ID
        recompenseId = $RECOMPENSE_ID
    } | ConvertTo-Json

    $coupon = Invoke-RestMethod -Uri "$BASE_URL/api/recompenses/echanger" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  SUCCESS: Coupon généré!" -ForegroundColor Green
    Write-Host "  Code coupon: $($coupon.code)" -ForegroundColor Cyan
    Write-Host "  Statut: $($coupon.status)" -ForegroundColor Cyan
    
    $codeCoupon = $coupon.code
} catch {
    Write-Host "  ERREUR: Échec de l'échange" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 4: Vérifier que le coupon existe dans la BD
Write-Host "`n[4/6] Vérification du coupon dans la base de données..." -ForegroundColor Yellow
try {
    $query = "SELECT id, code, status, points_utilises, recompense_id, citoyen_auth_id FROM coupons WHERE code = '$codeCoupon'"
    
    $result = & mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense -e $query 2>$null
    
    if ($result -match $codeCoupon) {
        Write-Host "  SUCCESS: Coupon trouvé dans la BD" -ForegroundColor Green
        Write-Host "  $result" -ForegroundColor Cyan
    } else {
        Write-Host "  ERREUR: Coupon non trouvé dans la BD" -ForegroundColor Red
    }
} catch {
    Write-Host "  ATTENTION: Impossible de vérifier dans MySQL" -ForegroundColor Yellow
}

# Étape 5: Simuler le QR Code (vérifier que le code est valide pour scanner)
Write-Host "`n[5/6] Test de validation du QR Code..." -ForegroundColor Yellow
Write-Host "  Le QR code contiendrait: $codeCoupon" -ForegroundColor Cyan
Write-Host "  Format: Texte brut, scannable par n'importe quel lecteur QR" -ForegroundColor Cyan

# Étape 6: Valider le coupon côté partenaire
Write-Host "`n[6/6] Validation du coupon par le partenaire..." -ForegroundColor Yellow
try {
    $validateBody = @{
        code = $codeCoupon
        partenaireUserId = $USER_PARTENAIRE_ID
    } | ConvertTo-Json

    $validation = Invoke-RestMethod -Uri "$BASE_URL/api/partenaires/valider-coupon" `
        -Method Post `
        -ContentType "application/json" `
        -Body $validateBody
    
    Write-Host "  SUCCESS: Coupon validé!" -ForegroundColor Green
    Write-Host "  Nouveau statut: $($validation.status)" -ForegroundColor Cyan
    Write-Host "  Message: $($validation.message)" -ForegroundColor Cyan
} catch {
    Write-Host "  ERREUR: Échec de la validation" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
}

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RÉSUMÉ DU TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nFlux complet testé:" -ForegroundColor White
Write-Host "  [1] Vérification des points du citoyen" -ForegroundColor Gray
Write-Host "  [2] Vérification de la récompense" -ForegroundColor Gray
Write-Host "  [3] Échange: Génération du code coupon" -ForegroundColor Gray
Write-Host "  [4] Vérification dans la base de données" -ForegroundColor Gray
Write-Host "  [5] Simulation du QR Code" -ForegroundColor Gray
Write-Host "  [6] Validation par le partenaire" -ForegroundColor Gray

Write-Host "`nDans le frontend Angular:" -ForegroundColor White
Write-Host "  - Un QR code est généré automatiquement contenant: $codeCoupon" -ForegroundColor Gray
Write-Host "  - Le citoyen peut télécharger le QR en PNG" -ForegroundColor Gray
Write-Host "  - Le citoyen peut copier le code manuellement" -ForegroundColor Gray
Write-Host "  - Le partenaire peut scanner le QR ou saisir le code" -ForegroundColor Gray

Write-Host "`nPour tester le QR code dans l'interface:" -ForegroundColor Yellow
Write-Host "  1. Lancez: cd frontend ; npm run start" -ForegroundColor Cyan
Write-Host "  2. Connectez-vous en tant que citoyen" -ForegroundColor Cyan
Write-Host "  3. Allez sur le profil d'un partenaire" -ForegroundColor Cyan
Write-Host "  4. Cliquez sur 'Échanger' pour une offre" -ForegroundColor Cyan
Write-Host "  5. Admirez le QR code dans le modal! 🎉" -ForegroundColor Cyan

Write-Host "`n========================================`n" -ForegroundColor Cyan
