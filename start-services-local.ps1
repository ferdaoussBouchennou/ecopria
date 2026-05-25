# Script pour demarrer tous les microservices en local
# Les bases MySQL et Kafka doivent etre demarres dans Docker Desktop
# Usage: .\start-services-local.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMARRAGE DES MICROSERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verification des connexions MySQL et Kafka
Write-Host "Verification des connexions..." -ForegroundColor Yellow
.\test-mysql-connections.ps1
Write-Host ""

$continue = Read-Host "Voulez-vous continuer le demarrage des services? (O/N)"
if ($continue -ne "O" -and $continue -ne "o") {
    Write-Host "Demarrage annule." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPILATION DES SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="auth-service"; Port=8081; Path="backend\auth-service"},
    @{Name="service-utilisateur"; Port=8082; Path="backend\service-utilisateur"},
    @{Name="service-inscription"; Port=8084; Path="backend\service-inscription"},
    @{Name="service-presence"; Port=8085; Path="backend\service-presence"},
    @{Name="service-notification"; Port=8086; Path="backend\service-notification"},
    @{Name="admin-service"; Port=8087; Path="backend\admin-service"},
    @{Name="service-action"; Port=9090; Path="backend\service-action"},
    @{Name="service-recompense"; Port=9093; Path="backend\service-recompense"},
    @{Name="api-gateway"; Port=8080; Path="backend\api-gateway"}
)

# Compilation de tous les services
foreach ($service in $services) {
    Write-Host "[$($service.Name)] Compilation..." -ForegroundColor Yellow
    Push-Location $service.Path
    $output = mvn clean package -DskipTests 2>&1 | Out-Null
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$($service.Name)] Compilation reussie" -ForegroundColor Green
    } else {
        Write-Host "[$($service.Name)] Echec de compilation" -ForegroundColor Red
        Write-Host "Arret du script." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMARRAGE DES SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Les services vont demarrer dans des fenetres separees." -ForegroundColor Yellow
Write-Host "Ordre de demarrage:" -ForegroundColor Yellow
Write-Host "  1. auth-service (port 8081)" -ForegroundColor Gray
Write-Host "  2. service-utilisateur (port 8082)" -ForegroundColor Gray
Write-Host "  3. service-inscription (port 8084)" -ForegroundColor Gray
Write-Host "  4. service-presence (port 8085)" -ForegroundColor Gray
Write-Host "  5. service-notification (port 8086)" -ForegroundColor Gray
Write-Host "  6. admin-service (port 8087)" -ForegroundColor Gray
Write-Host "  7. service-action (port 9090)" -ForegroundColor Gray
Write-Host "  8. service-recompense (port 9093)" -ForegroundColor Gray
Write-Host "  9. api-gateway (port 8080)" -ForegroundColor Gray
Write-Host ""

$start = Read-Host "Appuyez sur Entree pour demarrer les services..."

foreach ($service in $services) {
    Write-Host "Demarrage de $($service.Name) sur le port $($service.Port)..." -ForegroundColor Green
    
    $jarPath = "$($service.Path)\target\*.jar"
    $jarFile = Get-ChildItem $jarPath | Select-Object -First 1
    
    if ($jarFile) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Service: $($service.Name) - Port: $($service.Port)' -ForegroundColor Cyan; java -jar '$($jarFile.FullName)'"
        Start-Sleep -Seconds 5
    } else {
        Write-Host "ERREUR: Fichier JAR non trouve pour $($service.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TOUS LES SERVICES SONT DEMARRES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs des services:" -ForegroundColor Yellow
Write-Host "  - API Gateway:           http://localhost:8080" -ForegroundColor Gray
Write-Host "  - Auth Service:          http://localhost:8081" -ForegroundColor Gray
Write-Host "  - Service Utilisateur:   http://localhost:8082" -ForegroundColor Gray
Write-Host "  - Service Inscription:   http://localhost:8084" -ForegroundColor Gray
Write-Host "  - Service Presence:      http://localhost:8085" -ForegroundColor Gray
Write-Host "  - Service Notification:  http://localhost:8086" -ForegroundColor Gray
Write-Host "  - Admin Service:         http://localhost:8087" -ForegroundColor Gray
Write-Host "  - Service Action:        http://localhost:9090" -ForegroundColor Gray
Write-Host "  - Service Recompense:    http://localhost:9093" -ForegroundColor Gray
Write-Host ""
Write-Host "  - Kafka UI:              http://localhost:8090" -ForegroundColor Gray
Write-Host "  - phpMyAdmin:            http://localhost:8888" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour arreter les services, fermez les fenetres PowerShell correspondantes." -ForegroundColor Yellow
