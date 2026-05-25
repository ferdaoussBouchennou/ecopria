# Script PowerShell pour démarrer tous les microservices Ecopria en local
# Les bases de données et Kafka doivent tourner dans Docker Desktop

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Démarrage des Microservices Ecopria  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker Desktop est lancé
Write-Host "Vérification de Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERREUR: Docker Desktop n'est pas lancé!" -ForegroundColor Red
    Write-Host "Veuillez démarrer Docker Desktop et réessayer." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker Desktop est actif" -ForegroundColor Green
Write-Host ""

# Liste des services dans l'ordre de démarrage recommandé
$services = @(
    @{Name="auth-service"; Port=8081; Description="Service d'authentification"},
    @{Name="service-utilisateur"; Port=8082; Description="Gestion des utilisateurs"},
    @{Name="service-action"; Port=9090; Description="Gestion des actions"},
    @{Name="service-inscription"; Port=8084; Description="Gestion des inscriptions"},
    @{Name="service-presence"; Port=8085; Description="Gestion des présences"},
    @{Name="service-notification"; Port=8086; Description="Gestion des notifications"},
    @{Name="service-recompense"; Port=9093; Description="Gestion des récompenses"},
    @{Name="admin-service"; Port=8087; Description="Service admin"},
    @{Name="api-gateway"; Port=8080; Description="API Gateway"}
)

Write-Host "Démarrage de $($services.Count) microservices..." -ForegroundColor Cyan
Write-Host ""

$startedServices = @()

foreach ($service in $services) {
    $serviceName = $service.Name
    $servicePort = $service.Port
    $serviceDesc = $service.Description
    
    Write-Host "🚀 Démarrage de $serviceName (port $servicePort)" -ForegroundColor Green
    Write-Host "   $serviceDesc" -ForegroundColor Gray
    
    # Vérifier si le port est déjà utilisé
    $portInUse = netstat -ano | Select-String ":$servicePort " | Select-Object -First 1
    if ($portInUse) {
        Write-Host "   ⚠️  Le port $servicePort est déjà utilisé" -ForegroundColor Yellow
    }
    
    # Démarrer le service dans une nouvelle fenêtre PowerShell
    $scriptBlock = "cd '$PSScriptRoot\backend\$serviceName'; Write-Host '=== $serviceName ===' -ForegroundColor Cyan; mvn spring-boot:run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
    
    $startedServices += $serviceName
    
    # Attendre un peu entre chaque démarrage
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Tous les services sont en cours de démarrage!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services démarrés:" -ForegroundColor Yellow
foreach ($service in $services) {
    Write-Host "  • $($service.Name) → http://localhost:$($service.Port)" -ForegroundColor White
}
Write-Host ""
Write-Host "📝 Conseils:" -ForegroundColor Cyan
Write-Host "  • Chaque service s'ouvre dans une fenêtre PowerShell séparée" -ForegroundColor Gray
Write-Host "  • Attendez que tous les services affichent 'Started Application'" -ForegroundColor Gray
Write-Host "  • Vérifiez les logs dans chaque fenêtre pour détecter les erreurs" -ForegroundColor Gray
Write-Host "  • Pour arrêter un service, fermez sa fenêtre ou faites Ctrl+C" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Vérification de santé:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:8080/actuator/health  (API Gateway)" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Consultez DEMARRAGE_LOCAL.md pour plus d'informations" -ForegroundColor Yellow
Write-Host ""
