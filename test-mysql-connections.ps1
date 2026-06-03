# Script de vérification des connexions MySQL
# Teste toutes les bases de données Ecopria

Write-Host "=== Test des connexions MySQL Ecopria ===" -ForegroundColor Cyan
Write-Host ""

$databases = @(
    @{Name="mysql-auth"; Port=3316; Database="db_auth"},
    @{Name="mysql-utilisateur"; Port=3307; Database="db_utilisateur"},
    @{Name="mysql-action"; Port=3308; Database="db_action"},
    @{Name="mysql-recompense"; Port=3311; Database="db_recompense"}
)

$user = "ecopria"
$password = "ecopria_pass_2026"

foreach ($db in $databases) {
    Write-Host "Test: $($db.Name) (port $($db.Port))..." -NoNewline
    
    try {
        $result = docker exec $($db.Name) mysql -u $user "-p$password" $($db.Database) -e "SELECT 'OK' AS Status;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ SUCCESS" -ForegroundColor Green
        } else {
            Write-Host " ❌ FAILED" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Vérification des conteneurs ===" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "mysql|kafka"

Write-Host ""
Write-Host "Test terminé!" -ForegroundColor Green
