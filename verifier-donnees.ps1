Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VÉRIFICATION DES DONNÉES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Points du citoyen
Write-Host "[1] Points du citoyen (auth_id=1):" -ForegroundColor Yellow
$points = docker exec mysql-utilisateur mysql -u ecopria -pecopria_pass_2026 db_utilisateur -N -e "SELECT total_points, points_disponibles FROM citizens WHERE auth_id = 1;" 2>$null
if ($points) {
    $p = $points -split '\s+'
    Write-Host "  Total: $($p[0]) points" -ForegroundColor Green
    Write-Host "  Disponibles: $($p[1]) points" -ForegroundColor Green
} else {
    Write-Host "  [ERREUR] Citoyen non trouvé" -ForegroundColor Red
}

# Partenaires
Write-Host "`n[2] Partenaires disponibles:" -ForegroundColor Yellow
Write-Host "  ID | user_id | Nom" -ForegroundColor DarkGray
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -N -e "SELECT id, user_id, name FROM partenaires ORDER BY user_id LIMIT 10;" 2>$null | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Cyan
}

# Récompenses actives
Write-Host "`n[3] Récompenses actives:" -ForegroundColor Yellow
Write-Host "  ID | Points | Titre | Partenaire user_id" -ForegroundColor DarkGray
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -N -e "
SELECT r.id, r.points_necessaires, r.title, p.user_id
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE r.is_active = true
ORDER BY p.user_id, r.id
LIMIT 10;
" 2>$null | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Cyan
}

# Derniers coupons
Write-Host "`n[4] Derniers coupons générés:" -ForegroundColor Yellow
Write-Host "  Code | Statut | Citoyen | Partenaire user_id" -ForegroundColor DarkGray
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -N -e "
SELECT c.code, c.status, c.user_id, p.user_id
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
ORDER BY c.created_at DESC
LIMIT 5;
" 2>$null | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RECOMMANDATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nPour tester le flux complet:" -ForegroundColor White
Write-Host "  1. Choisissez une récompense ET notez son partenaire user_id" -ForegroundColor Yellow
Write-Host "  2. Modifiez test-flux-echange.ps1:" -ForegroundColor Yellow
Write-Host "       USER_PARTENAIRE_ID = [user_id du partenaire]" -ForegroundColor Cyan
Write-Host "       RECOMPENSE_ID = [id de la récompense]" -ForegroundColor Cyan
Write-Host "  3. Exécutez: .\test-flux-echange.ps1" -ForegroundColor Yellow
Write-Host "`n========================================`n" -ForegroundColor Cyan
