# ========================================
# Script PowerShell - Chargement donnees demo
# Service Recompense - Ecopria
# ========================================

Write-Host "Chargement des donnees de demonstration..." -ForegroundColor Cyan
Write-Host ""

# Parametres de connexion
$containerName = "mysql-recompense"
$dbUser = "ecopria"
$dbPassword = "ecopria_pass_2026"
$dbName = "db_recompense"
$sqlFile = "data-demo.sql"

# Verifier que Docker est disponible
try {
    docker --version | Out-Null
} catch {
    Write-Host "Docker n'est pas installe ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Verifier que le conteneur existe
$containerExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "^$containerName`$"
if (-not $containerExists) {
    Write-Host "Le conteneur '$containerName' n'existe pas" -ForegroundColor Red
    Write-Host "Lancez d'abord 'docker-compose up -d'" -ForegroundColor Yellow
    exit 1
}

# Verifier que le conteneur est en cours d'execution
$containerRunning = docker ps --format "{{.Names}}" | Select-String -Pattern "^$containerName`$"
if (-not $containerRunning) {
    Write-Host "Le conteneur '$containerName' n'est pas demarre" -ForegroundColor Red
    Write-Host "Lancez 'docker start $containerName'" -ForegroundColor Yellow
    exit 1
}

# Verifier que le fichier SQL existe
if (-not (Test-Path $sqlFile)) {
    Write-Host "Fichier '$sqlFile' introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "Docker OK" -ForegroundColor Green
Write-Host "Conteneur '$containerName' en cours d'execution" -ForegroundColor Green
Write-Host "Fichier SQL trouve" -ForegroundColor Green
Write-Host ""

# Test de connexion
Write-Host "Test de connexion a la base de donnees..." -ForegroundColor Cyan
$testResult = docker exec -i $containerName mysql -u $dbUser -p$dbPassword $dbName -e "SELECT 1 as test;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Connexion reussie" -ForegroundColor Green
} else {
    Write-Host "Echec de connexion" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

Write-Host ""
Write-Host "Chargement des donnees..." -ForegroundColor Cyan

# Executer le script SQL
Get-Content $sqlFile | docker exec -i $containerName mysql -u $dbUser -p$dbPassword $dbName 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Donnees chargees avec succes" -ForegroundColor Green
} else {
    Write-Host "Erreur lors du chargement" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verification des donnees..." -ForegroundColor Cyan
Write-Host ""

# Compter les partenaires
$partnersResult = docker exec -i $containerName mysql -u $dbUser -p$dbPassword $dbName -e "SELECT COUNT(*) FROM partenaires;" 2>&1
$partnersCount = ($partnersResult | Select-String -Pattern "\d+" | Select-Object -Last 1).Matches.Value
Write-Host "Partenaires : $partnersCount" -ForegroundColor White

# Compter les offres actives
$offersResult = docker exec -i $containerName mysql -u $dbUser -p$dbPassword $dbName -e "SELECT COUNT(*) FROM recompenses WHERE is_active = 1;" 2>&1
$offersCount = ($offersResult | Select-String -Pattern "\d+" | Select-Object -Last 1).Matches.Value
Write-Host "Offres actives : $offersCount" -ForegroundColor White

# Compter les avis
$reviewsResult = docker exec -i $containerName mysql -u $dbUser -p$dbPassword $dbName -e "SELECT COUNT(*) FROM avis_partenaire;" 2>&1
$reviewsCount = ($reviewsResult | Select-String -Pattern "\d+" | Select-Object -Last 1).Matches.Value
Write-Host "Avis clients : $reviewsCount" -ForegroundColor White

Write-Host ""
Write-Host "Termine ! Vous pouvez maintenant tester l'application." -ForegroundColor Green
Write-Host ""
Write-Host "Accedez a :" -ForegroundColor Cyan
Write-Host "Frontend : http://localhost:4200/partenaires" -ForegroundColor White
Write-Host "API : http://localhost:8080/api/recompenses/public/partenaires" -ForegroundColor White
Write-Host ""
