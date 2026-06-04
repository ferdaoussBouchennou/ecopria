# Script de Test Backend - Points

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST BACKEND - RÉCUPÉRATION DES POINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$USER_ID = 1
$BASE_URL = "http://localhost:8082"

# Test 1 : Vérifier que le service est actif
Write-Host "1. Vérification du service-utilisateur..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/actuator/health" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Service actif: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Service non accessible sur $BASE_URL" -ForegroundColor Red
    Write-Host "   Assurez-vous que service-utilisateur est démarré" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2 : Récupérer les points
Write-Host "2. Récupération des points pour authId=$USER_ID..." -ForegroundColor Yellow
Write-Host "   URL: GET $BASE_URL/api/utilisateurs/$USER_ID/points" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/utilisateurs/$USER_ID/points" -Method Get -ErrorAction Stop
    $points = $response.totalPoints
    
    Write-Host "   ✓ Réponse reçue:" -ForegroundColor Green
    Write-Host "     {" -ForegroundColor White
    Write-Host "       `"totalPoints`": $points" -ForegroundColor White
    Write-Host "     }" -ForegroundColor White
    Write-Host ""
    
    if ($points -eq 0) {
        Write-Host "   ⚠️ ATTENTION: Les points sont à 0!" -ForegroundColor Yellow
        Write-Host "   Causes possibles:" -ForegroundColor Yellow
        Write-Host "   - L'utilisateur authId=$USER_ID n'existe pas" -ForegroundColor Gray
        Write-Host "   - La colonne total_points est à 0 ou NULL" -ForegroundColor Gray
        Write-Host "   - Le backend cherche un autre ID" -ForegroundColor Gray
    } else {
        Write-Host "   ✓ Points: $points" -ForegroundColor Green
    }
    
} catch {
    Write-Host "   ✗ Erreur lors de la récupération des points" -ForegroundColor Red
    Write-Host "   Détails: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "   Code HTTP: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host ""
            Write-Host "   → L'utilisateur authId=$USER_ID n'existe probablement pas" -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host ""
            Write-Host "   → Erreur serveur - Vérifier les logs du backend" -ForegroundColor Yellow
        }
    }
    exit 1
}

Write-Host ""

# Test 3 : Tester via le path /api/users (alternative)
Write-Host "3. Test via /api/users (alternative)..." -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "$BASE_URL/api/users/$USER_ID/points" -Method Get -ErrorAction Stop
    $points2 = $response2.totalPoints
    Write-Host "   ✓ Points via /api/users: $points2" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erreur via /api/users" -ForegroundColor Yellow
}

Write-Host ""

# Test 4 : Récupérer le profil complet
Write-Host "4. Récupération du profil complet..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$BASE_URL/api/utilisateurs/$USER_ID/profile" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Profil trouvé:" -ForegroundColor Green
    Write-Host "     Nom: $($profile.firstName) $($profile.lastName)" -ForegroundColor White
    Write-Host "     Email: $($profile.email)" -ForegroundColor White
    Write-Host "     AuthId: $($profile.authId)" -ForegroundColor White
    Write-Host "     Total Points: $($profile.totalPoints)" -ForegroundColor White
    Write-Host "     Trust Score: $($profile.trustScore)" -ForegroundColor White
} catch {
    Write-Host "   ⚠️ Impossible de récupérer le profil" -ForegroundColor Yellow
}

Write-Host ""

# Test 5 : Dashboard
Write-Host "5. Récupération du dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$BASE_URL/api/utilisateurs/$USER_ID/dashboard" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Dashboard récupéré:" -ForegroundColor Green
    Write-Host "     Total Points: $($dashboard.totalPoints)" -ForegroundColor White
    Write-Host "     Level: $($dashboard.level)" -ForegroundColor White
    Write-Host "     Rank: $($dashboard.rank)" -ForegroundColor White
} catch {
    Write-Host "   ⚠️ Impossible de récupérer le dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AuthId testé: $USER_ID" -ForegroundColor White
Write-Host "Points API /points: $points" -ForegroundColor White
Write-Host ""

if ($points -eq 0) {
    Write-Host "🔴 PROBLÈME IDENTIFIÉ: Points = 0" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions à faire:" -ForegroundColor Yellow
    Write-Host "1. Vérifier les logs du service-utilisateur (Spring Boot)" -ForegroundColor White
    Write-Host "2. Vérifier la base de données avec le script SQL" -ForegroundColor White
    Write-Host "3. Exécuter: mysql -u ecopria -p -h localhost -P 3307" -ForegroundColor White
    Write-Host "   USE db_utilisateur;" -ForegroundColor White
    Write-Host "   SELECT * FROM citizens WHERE auth_id = $USER_ID;" -ForegroundColor White
} else {
    Write-Host "✅ Les points sont correctement récupérés par le backend!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Si le frontend affiche toujours 0, le problème est:" -ForegroundColor Yellow
    Write-Host "- Dans le code frontend (Angular)" -ForegroundColor White
    Write-Host "- Dans l'ID utilisateur stocké (localStorage)" -ForegroundColor White
    Write-Host "- Dans le routing/proxy" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Consultez DEBUG-BACKEND-LOGS.md pour interpréter les logs" -ForegroundColor Cyan
Write-Host ""
