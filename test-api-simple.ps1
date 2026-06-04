Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST API BACKEND - POINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$USER_ID = 1
$BASE_URL = "http://localhost:8082"

# Test 1 : Health check
Write-Host "1. Health check du service..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/actuator/health" -ErrorAction Stop
    Write-Host "   ✅ Service actif: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Service non accessible sur $BASE_URL" -ForegroundColor Red
    Write-Host "   → Démarrez le service: cd backend/service-utilisateur && ./mvnw spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2 : Points via /api/users
Write-Host "2. GET /api/users/$USER_ID/points" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/users/$USER_ID/points" -ErrorAction Stop
    $points = $response.totalPoints
    
    Write-Host "   Réponse:" -ForegroundColor White
    Write-Host "   {" -ForegroundColor Gray
    Write-Host "     `"totalPoints`": $points" -ForegroundColor Gray
    Write-Host "   }" -ForegroundColor Gray
    Write-Host ""
    
    if ($points -gt 0) {
        Write-Host "   ✅ Points récupérés: $points" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Points à zéro!" -ForegroundColor Yellow
        Write-Host "   → Vérifiez la base de données" -ForegroundColor Yellow
    }
    
    $pointsFromAPI = $points
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    $pointsFromAPI = $null
}

Write-Host ""

# Test 3 : Points via /api/utilisateurs
Write-Host "3. GET /api/utilisateurs/$USER_ID/points" -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "$BASE_URL/api/utilisateurs/$USER_ID/points" -ErrorAction Stop
    $points2 = $response2.totalPoints
    Write-Host "   ✅ Points: $points2" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Erreur" -ForegroundColor Yellow
}

Write-Host ""

# Test 4 : Profil complet
Write-Host "4. GET /api/users/$USER_ID/profile" -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$BASE_URL/api/users/$USER_ID/profile" -ErrorAction Stop
    Write-Host "   ✅ Profil récupéré:" -ForegroundColor Green
    Write-Host "      Nom: $($profile.firstName) $($profile.lastName)" -ForegroundColor White
    Write-Host "      Email: $($profile.email)" -ForegroundColor White
    Write-Host "      AuthId: $($profile.authId)" -ForegroundColor White
    Write-Host "      Total Points: $($profile.totalPoints)" -ForegroundColor White
    
    $pointsFromProfile = $profile.totalPoints
} catch {
    Write-Host "   ⚠️  Impossible de récupérer le profil" -ForegroundColor Yellow
    Write-Host "   Erreur: $_" -ForegroundColor Red
    $pointsFromProfile = $null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($pointsFromAPI -ne $null) {
    if ($pointsFromAPI -gt 0) {
        Write-Host "✅ BACKEND FONCTIONNE CORRECTEMENT" -ForegroundColor Green
        Write-Host ""
        Write-Host "   L'API retourne: $pointsFromAPI points" -ForegroundColor White
        Write-Host ""
        Write-Host "   Si le frontend affiche toujours 0:" -ForegroundColor Yellow
        Write-Host "   1. Ouvrez http://localhost:4200/partenaires/2" -ForegroundColor White
        Write-Host "   2. Appuyez sur F12 (Console)" -ForegroundColor White
        Write-Host "   3. Vérifiez les logs frontend" -ForegroundColor White
        Write-Host "   4. Testez: localStorage.getItem('ecopria_user_id')" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "⚠️  PROBLÈME: Points à 0 dans la base de données" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Solution:" -ForegroundColor Yellow
        Write-Host "   1. Connectez-vous à MySQL:" -ForegroundColor White
        Write-Host "      mysql -u ecopria -p -h localhost -P 3307" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   2. Vérifiez les données:" -ForegroundColor White
        Write-Host "      USE db_utilisateur;" -ForegroundColor Gray
        Write-Host "      SELECT auth_id, first_name, last_name, total_points" -ForegroundColor Gray
        Write-Host "      FROM citizens WHERE auth_id = $USER_ID;" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   3. Mettez à jour les points:" -ForegroundColor White
        Write-Host "      UPDATE citizens" -ForegroundColor Gray
        Write-Host "      SET total_points = 400" -ForegroundColor Gray
        Write-Host "      WHERE auth_id = $USER_ID;" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   4. Relancez ce script pour vérifier" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "❌ PROBLÈME BACKEND" -ForegroundColor Red
    Write-Host ""
    Write-Host "   L'utilisateur authId=$USER_ID n'existe pas ou l'API ne répond pas" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Vérifiez:" -ForegroundColor Yellow
    Write-Host "   1. Le service-utilisateur est bien démarré" -ForegroundColor White
    Write-Host "   2. L'utilisateur existe dans la DB" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
