# ============================================
# Script PowerShell - Test API Échange de Points
# ============================================
# Ce script teste le flux complet d'échange de points

# Configuration
$USER_ID = 1
$PARTNER_USER_ID = 2
$BASE_URL_USER = "http://localhost:8082"
$BASE_URL_REWARD = "http://localhost:8084"
$BASE_URL_GATEWAY = "http://localhost:8080"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TEST SYSTÈME D'ÉCHANGE DE POINTS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Vérifier les points de l'utilisateur
# ============================================
Write-Host "1. Vérification du solde de points..." -ForegroundColor Yellow
Write-Host "   URL: GET $BASE_URL_USER/api/utilisateurs/$USER_ID/points" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL_USER/api/utilisateurs/$USER_ID/points" -Method Get
    $pointsAvant = $response.totalPoints
    Write-Host "   ✓ Solde actuel: $pointsAvant points" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erreur lors de la récupération des points" -ForegroundColor Red
    Write-Host "   Détails: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 2. Consulter le catalogue des offres
# ============================================
Write-Host "2. Consultation du catalogue des offres..." -ForegroundColor Yellow
Write-Host "   URL: GET $BASE_URL_REWARD/api/recompenses" -ForegroundColor Gray

try {
    $offres = Invoke-RestMethod -Uri "$BASE_URL_REWARD/api/recompenses" -Method Get
    Write-Host "   ✓ Nombre d'offres disponibles: $($offres.Count)" -ForegroundColor Green
    
    if ($offres.Count -eq 0) {
        Write-Host "   ⚠ Aucune offre disponible pour tester l'échange" -ForegroundColor Yellow
        exit 1
    }
    
    # Afficher les 3 premières offres
    Write-Host ""
    Write-Host "   Offres disponibles:" -ForegroundColor Cyan
    foreach ($offre in $offres | Select-Object -First 3) {
        Write-Host "   - ID: $($offre.id) | $($offre.title) | $($offre.pointsNecessaires) points | Type: $($offre.type)" -ForegroundColor White
        if ($offre.type -eq "STOCK") {
            Write-Host "     Stock: $($offre.stock)" -ForegroundColor Gray
        }
        if ($offre.discountPercentage) {
            Write-Host "     Réduction: $($offre.discountPercentage)%" -ForegroundColor Gray
        }
    }
    
    # Sélectionner la première offre que l'utilisateur peut se permettre
    $offreChoisie = $null
    foreach ($offre in $offres) {
        if ($offre.pointsNecessaires -le $pointsAvant -and $offre.isActive) {
            $offreChoisie = $offre
            break
        }
    }
    
    if ($null -eq $offreChoisie) {
        Write-Host ""
        Write-Host "   ⚠ Aucune offre accessible avec $pointsAvant points" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "   → Offre sélectionnée pour l'échange:" -ForegroundColor Cyan
    Write-Host "     ID: $($offreChoisie.id)" -ForegroundColor White
    Write-Host "     Titre: $($offreChoisie.title)" -ForegroundColor White
    Write-Host "     Points nécessaires: $($offreChoisie.pointsNecessaires)" -ForegroundColor White
    Write-Host "     Partenaire: $($offreChoisie.partenaireName)" -ForegroundColor White
    
} catch {
    Write-Host "   ✗ Erreur lors de la récupération des offres" -ForegroundColor Red
    Write-Host "   Détails: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 3. Échanger des points contre l'offre
# ============================================
Write-Host "3. Échange de points contre l'offre..." -ForegroundColor Yellow
Write-Host "   URL: POST $BASE_URL_REWARD/api/recompenses/echanger" -ForegroundColor Gray

$body = @{
    recompenseId = $offreChoisie.id
} | ConvertTo-Json

try {
    $coupon = Invoke-RestMethod -Uri "$BASE_URL_REWARD/api/recompenses/echanger" `
        -Method Post `
        -Headers @{"X-User-Id" = $USER_ID; "Content-Type" = "application/json"} `
        -Body $body
    
    Write-Host "   ✓ Échange réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   🎟️  CODE COUPON GÉNÉRÉ:" -ForegroundColor Cyan
    Write-Host "   ════════════════════════" -ForegroundColor Cyan
    Write-Host "   Code: $($coupon.code)" -ForegroundColor Yellow
    Write-Host "   Offre: $($coupon.recompenseTitle)" -ForegroundColor White
    Write-Host "   Partenaire: $($coupon.partenaireName)" -ForegroundColor White
    Write-Host "   Points utilisés: $($coupon.pointsUtilises)" -ForegroundColor White
    Write-Host "   Statut: $($coupon.status)" -ForegroundColor White
    Write-Host "   Expire le: $($coupon.expireLe)" -ForegroundColor White
    Write-Host "   ════════════════════════" -ForegroundColor Cyan
    
    $codeGenere = $coupon.code
    
} catch {
    Write-Host "   ✗ Erreur lors de l'échange" -ForegroundColor Red
    Write-Host "   Détails: $_" -ForegroundColor Red
    
    # Essayer d'extraire le message d'erreur
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Réponse serveur: $responseBody" -ForegroundColor Red
    }
    
    exit 1
}

Write-Host ""

# ============================================
# 4. Vérifier le nouveau solde
# ============================================
Write-Host "4. Vérification du nouveau solde..." -ForegroundColor Yellow

try {
    Start-Sleep -Seconds 2  # Attendre que Kafka propage l'événement
    $response = Invoke-RestMethod -Uri "$BASE_URL_USER/api/utilisateurs/$USER_ID/points" -Method Get
    $pointsApres = $response.totalPoints
    $pointsDeduits = $pointsAvant - $pointsApres
    
    Write-Host "   Solde avant: $pointsAvant points" -ForegroundColor Gray
    Write-Host "   Solde après: $pointsApres points" -ForegroundColor Gray
    Write-Host "   ✓ Points déduits: $pointsDeduits points" -ForegroundColor Green
    
} catch {
    Write-Host "   ⚠ Impossible de vérifier le nouveau solde (vérifier que Kafka fonctionne)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 5. Consulter mes coupons
# ============================================
Write-Host "5. Consultation de mes coupons..." -ForegroundColor Yellow

try {
    $mesCoupons = Invoke-RestMethod -Uri "$BASE_URL_REWARD/api/recompenses/mes-coupons" `
        -Method Get `
        -Headers @{"X-User-Id" = $USER_ID}
    
    Write-Host "   ✓ Nombre de coupons: $($mesCoupons.Count)" -ForegroundColor Green
    
    if ($mesCoupons.Count -gt 0) {
        Write-Host ""
        Write-Host "   Liste des coupons:" -ForegroundColor Cyan
        foreach ($c in $mesCoupons | Select-Object -First 5) {
            $statusColor = switch ($c.status) {
                "DISTRIBUE" { "Green" }
                "UTILISE" { "Gray" }
                "EXPIRE" { "Red" }
                default { "White" }
            }
            Write-Host "   - $($c.code) | $($c.recompenseTitle) | Statut: $($c.status)" -ForegroundColor $statusColor
        }
    }
    
} catch {
    Write-Host "   ⚠ Erreur lors de la récupération des coupons" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================
# 6. TEST PARTENAIRE - Valider le coupon
# ============================================
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TEST ESPACE PARTENAIRE" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "6. Validation du code coupon par le partenaire..." -ForegroundColor Yellow
Write-Host "   Code à valider: $codeGenere" -ForegroundColor White
Write-Host "   Partenaire User ID: $PARTNER_USER_ID" -ForegroundColor White
Write-Host ""

$continuer = Read-Host "   Voulez-vous tester la validation du coupon ? (O/N)"

if ($continuer -eq "O" -or $continuer -eq "o") {
    
    $bodyValidation = @{
        code = $codeGenere
    } | ConvertTo-Json
    
    try {
        $couponValide = Invoke-RestMethod -Uri "$BASE_URL_REWARD/api/partenaire/valider-coupon" `
            -Method Post `
            -Headers @{"X-User-Id" = $PARTNER_USER_ID; "Content-Type" = "application/json"} `
            -Body $bodyValidation
        
        Write-Host "   ✓ Coupon validé avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   📋 DÉTAILS DE LA VALIDATION:" -ForegroundColor Cyan
        Write-Host "   ════════════════════════════" -ForegroundColor Cyan
        Write-Host "   Code: $($couponValide.code)" -ForegroundColor White
        Write-Host "   Statut: $($couponValide.status)" -ForegroundColor Yellow
        Write-Host "   Validé le: $($couponValide.valideLe)" -ForegroundColor White
        Write-Host "   ════════════════════════════" -ForegroundColor Cyan
        
    } catch {
        Write-Host "   ✗ Erreur lors de la validation" -ForegroundColor Red
        Write-Host "   Détails: $_" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Réponse serveur: $responseBody" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # ============================================
    # 7. Essayer de valider à nouveau (doit échouer)
    # ============================================
    Write-Host "7. Test de double utilisation (doit échouer)..." -ForegroundColor Yellow
    
    try {
        $couponValide = Invoke-RestMethod -Uri "$BASE_URL_REWARD/api/partenaire/valider-coupon" `
            -Method Post `
            -Headers @{"X-User-Id" = $PARTNER_USER_ID; "Content-Type" = "application/json"} `
            -Body $bodyValidation
        
        Write-Host "   ✗ ERREUR: Le coupon a pu être validé deux fois!" -ForegroundColor Red
        
    } catch {
        Write-Host "   ✓ Double utilisation correctement bloquée" -ForegroundColor Green
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Message: $responseBody" -ForegroundColor Gray
        }
    }
    
} else {
    Write-Host "   ⊳ Validation du coupon ignorée" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Pour valider manuellement, utilisez:" -ForegroundColor Cyan
    Write-Host "   curl -X POST $BASE_URL_REWARD/api/partenaire/valider-coupon \" -ForegroundColor White
    Write-Host "     -H `"Content-Type: application/json`" \" -ForegroundColor White
    Write-Host "     -H `"X-User-Id: $PARTNER_USER_ID`" \" -ForegroundColor White
    Write-Host "     -d '{`"code`":`"$codeGenere`"}'" -ForegroundColor White
}

Write-Host ""
Write-Host ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ DU TEST" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Vérification des points: OK" -ForegroundColor Green
Write-Host "✓ Consultation du catalogue: OK" -ForegroundColor Green
Write-Host "✓ Échange de points: OK" -ForegroundColor Green
Write-Host "✓ Génération du code: $codeGenere" -ForegroundColor Green
Write-Host ""
Write-Host "Points avant: $pointsAvant" -ForegroundColor White
Write-Host "Points après: $pointsApres" -ForegroundColor White
Write-Host "Points déduits: $($pointsAvant - $pointsApres)" -ForegroundColor White
Write-Host ""
Write-Host "Offre échangée: $($offreChoisie.title)" -ForegroundColor White
Write-Host "Partenaire: $($offreChoisie.partenaireName)" -ForegroundColor White
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Pour plus de détails, consultez:" -ForegroundColor Cyan
Write-Host "   - GUIDE-TEST-ECHANGE-POINTS.md" -ForegroundColor White
Write-Host "   - test-points-echange.sql (requêtes SQL)" -ForegroundColor White
Write-Host ""
