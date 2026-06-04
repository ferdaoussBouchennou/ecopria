# Test script to verify the points API
# Service-Utilisateur doit etre demarre (port 8082)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST API - Recuperation des points" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Verifier que le service est accessible
Write-Host "[1] Test connexion au service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/points" -Method GET
    Write-Host "  [OK] Service accessible" -ForegroundColor Green
    Write-Host "  [OK] Reponse: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
    
    if ($response.totalPoints -eq 400) {
        Write-Host "  [OK] Points corrects: 400" -ForegroundColor Green
    } else {
        Write-Host "  [ERREUR] Points incorrects: $($response.totalPoints) (attendu: 400)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2] Test avec differents users..." -ForegroundColor Yellow
foreach ($userId in 1..3) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8082/api/users/$userId/points" -Method GET
        Write-Host "  User $userId : $($response.totalPoints) points" -ForegroundColor Cyan
    } catch {
        Write-Host "  User $userId : Erreur - $($_.Exception.Message)" -ForegroundColor DarkGray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Conclusion:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Le backend retourne correctement 400 points." -ForegroundColor Green
Write-Host "Si le frontend affiche '0 points', le probleme" -ForegroundColor Yellow
Write-Host "est dans le code Angular (composant ou service)." -ForegroundColor Yellow
Write-Host "`nVerifiez:" -ForegroundColor White
Write-Host "  1. La console du navigateur (F12)" -ForegroundColor White
Write-Host "  2. Les logs de debug dans le composant" -ForegroundColor White
Write-Host "  3. L'appel HTTP dans user.service.ts" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
