# Script pour démarrer service-utilisateur avec Docker
# Contourne le problème de Java 25 en utilisant Java 21 dans Docker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DÉMARRAGE SERVICE-UTILISATEUR (DOCKER)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Cette solution utilise Docker avec Java 21 pour contourner" -ForegroundColor Yellow
Write-Host "le problème de compatibilité avec Java 25 installé localement." -ForegroundColor Yellow
Write-Host ""

# Vérifier que Docker est installé
Write-Host "1. Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✓ Docker installé: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker n'est pas installé ou non démarré" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Solution:" -ForegroundColor Yellow
    Write-Host "   1. Installer Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "   2. Démarrer Docker Desktop" -ForegroundColor White
    Write-Host "   3. Relancer ce script" -ForegroundColor White
    exit 1
}

Write-Host ""

# Build l'image Docker
Write-Host "2. Construction de l'image Docker..." -ForegroundColor Yellow
Write-Host "   (Cela va télécharger Java 21 dans Docker et compiler le projet)" -ForegroundColor Gray
Write-Host ""

cd C:\Users\user\Desktop\ecopria\backend\service-utilisateur

docker build -t ecopria-service-utilisateur:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   ✓ Image construite avec succès" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "   ✗ Erreur lors de la construction" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Démarrer le conteneur
Write-Host "3. Démarrage du service..." -ForegroundColor Yellow

# Arrêter le conteneur existant s'il existe
docker stop ecopria-utilisateur 2>$null
docker rm ecopria-utilisateur 2>$null

# Démarrer le nouveau conteneur
docker run -d `
  --name ecopria-utilisateur `
  -p 8082:8082 `
  -e SPRING_DATASOURCE_URL="jdbc:mysql://host.docker.internal:3307/db_utilisateur?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true" `
  -e SPRING_DATASOURCE_USERNAME="ecopria" `
  -e SPRING_DATASOURCE_PASSWORD="ecopria_pass_2026" `
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS="host.docker.internal:29092" `
  ecopria-service-utilisateur:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Service démarré" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erreur lors du démarrage" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Attendre que le service démarre
Write-Host "4. Attente du démarrage (30 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Afficher les logs
Write-Host ""
Write-Host "   Logs du service:" -ForegroundColor Cyan
Write-Host "   ================================================" -ForegroundColor Gray
docker logs ecopria-utilisateur --tail 20
Write-Host "   ================================================" -ForegroundColor Gray

Write-Host ""

# Tester le service
Write-Host "5. Test du service..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8082/actuator/health" -ErrorAction Stop
    Write-Host "   ✓ Service actif: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Service pas encore prêt" -ForegroundColor Yellow
    Write-Host "   Attendez quelques secondes et testez manuellement:" -ForegroundColor Yellow
    Write-Host "   curl http://localhost:8082/actuator/health" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVICE DÉMARRÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Le service-utilisateur tourne maintenant sur http://localhost:8082" -ForegroundColor Green
Write-Host ""
Write-Host "Commandes utiles:" -ForegroundColor Cyan
Write-Host "  Voir les logs:  docker logs -f ecopria-utilisateur" -ForegroundColor White
Write-Host "  Arrêter:        docker stop ecopria-utilisateur" -ForegroundColor White
Write-Host "  Redémarrer:     docker restart ecopria-utilisateur" -ForegroundColor White
Write-Host ""
Write-Host "Testez maintenant l'API:" -ForegroundColor Cyan
Write-Host "  cd C:\Users\user\Desktop\ecopria" -ForegroundColor White
Write-Host "  .\test-api-simple.ps1" -ForegroundColor White
Write-Host ""
