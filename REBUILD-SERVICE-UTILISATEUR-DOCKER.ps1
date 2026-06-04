# Script pour rebuilder et démarrer le Service-Utilisateur dans Docker
# Avec les nouvelles modifications (déduction de points)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  REBUILD SERVICE-UTILISATEUR (DOCKER)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$SERVICE_DIR = "backend\service-utilisateur"

# Arrêter et supprimer le conteneur existant
Write-Host "[1/5] Arrêt du conteneur existant..." -ForegroundColor Yellow
try {
    docker stop ecopria-utilisateur 2>$null
    docker rm ecopria-utilisateur 2>$null
    Write-Host "  Conteneur arrêté et supprimé" -ForegroundColor Green
} catch {
    Write-Host "  Aucun conteneur à arrêter" -ForegroundColor Gray
}

# Supprimer l'ancienne image
Write-Host "`n[2/5] Suppression de l'ancienne image..." -ForegroundColor Yellow
try {
    docker rmi ecopria-service-utilisateur:latest 2>$null
    Write-Host "  Image supprimée" -ForegroundColor Green
} catch {
    Write-Host "  Aucune image à supprimer" -ForegroundColor Gray
}

# Builder la nouvelle image
Write-Host "`n[3/5] Construction de la nouvelle image..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre 2-3 minutes...`n" -ForegroundColor Cyan

Set-Location $SERVICE_DIR
try {
    docker build -t ecopria-service-utilisateur:latest .
    if ($LASTEXITCODE -ne 0) {
        throw "Build échoué"
    }
    Write-Host "`n  Image construite avec succès" -ForegroundColor Green
} catch {
    Write-Host "`n  ERREUR lors du build Docker" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}
Set-Location ..\..

# Démarrer le conteneur
Write-Host "`n[4/5] Démarrage du conteneur..." -ForegroundColor Yellow

$container = docker run -d `
    --name ecopria-utilisateur `
    -p 8082:8082 `
    -e SPRING_DATASOURCE_URL="jdbc:mysql://host.docker.internal:3307/db_utilisateur?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true" `
    -e SPRING_DATASOURCE_USERNAME=ecopria `
    -e SPRING_DATASOURCE_PASSWORD=ecopria_pass_2026 `
    -e SPRING_KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:29092 `
    ecopria-service-utilisateur:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Conteneur démarré: $container" -ForegroundColor Green
} else {
    Write-Host "  ERREUR lors du démarrage" -ForegroundColor Red
    exit 1
}

# Attendre que le service soit prêt
Write-Host "`n[5/5] Attente du démarrage du service..." -ForegroundColor Yellow
Write-Host "  Cela peut prendre 30-60 secondes...`n" -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$isReady = $false

while ($attempt -lt $maxAttempts -and -not $isReady) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8082/actuator/health" -UseBasicParsing -TimeoutSec 2 2>$null
        if ($response.StatusCode -eq 200) {
            $isReady = $true
            Write-Host "  ✅ Service prêt!" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Tentative $attempt/$maxAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "`n  ⚠️ Le service met du temps à démarrer" -ForegroundColor Yellow
    Write-Host "  Vérifiez les logs: docker logs ecopria-utilisateur" -ForegroundColor Yellow
} else {
    # Tester l'API
    Write-Host "`n[TEST] Vérification de l'API..." -ForegroundColor Yellow
    try {
        $pointsResponse = Invoke-RestMethod -Uri "http://localhost:8082/api/users/1/points" -Method Get
        Write-Host "  ✅ API fonctionnelle!" -ForegroundColor Green
        Write-Host "  Points du citoyen 1: $($pointsResponse.totalPoints)" -ForegroundColor Cyan
    } catch {
        Write-Host "  ⚠️ API non accessible encore" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SERVICE DÉMARRÉ!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Informations:" -ForegroundColor White
Write-Host "  Port: 8082" -ForegroundColor Gray
Write-Host "  Base de données: db_utilisateur (port 3307)" -ForegroundColor Gray
Write-Host "  Conteneur: ecopria-utilisateur" -ForegroundColor Gray

Write-Host "`nCommandes utiles:" -ForegroundColor White
Write-Host "  docker logs ecopria-utilisateur -f      # Voir les logs" -ForegroundColor Gray
Write-Host "  docker stop ecopria-utilisateur         # Arrêter" -ForegroundColor Gray
Write-Host "  docker start ecopria-utilisateur        # Redémarrer" -ForegroundColor Gray
Write-Host "  curl http://localhost:8082/api/users/1/points  # Tester" -ForegroundColor Gray

Write-Host "`n✅ Prêt à utiliser!`n" -ForegroundColor Green
