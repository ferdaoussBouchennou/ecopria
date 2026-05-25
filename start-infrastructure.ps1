# Script PowerShell pour démarrer uniquement l'infrastructure (Kafka + MySQL)
# Les microservices seront lancés en local

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Démarrage Infrastructure Ecopria     " -ForegroundColor Cyan
Write-Host "  (Kafka + Bases de données MySQL)     " -ForegroundColor Cyan
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

# Vérifier que le fichier .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Le fichier .env n'existe pas!" -ForegroundColor Yellow
    Write-Host "Création du fichier .env depuis .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Fichier .env créé. Veuillez le modifier avec vos valeurs." -ForegroundColor Green
        Write-Host ""
        Write-Host "Appuyez sur une touche pour continuer après avoir modifié .env..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Write-Host "❌ Le fichier .env.example n'existe pas!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Démarrage de l'infrastructure Docker..." -ForegroundColor Cyan
Write-Host ""

# Liste des services à démarrer
$services = @(
    "kafka",
    "kafka-ui",
    "phpmyadmin",
    "mysql-auth",
    "mysql-utilisateur",
    "mysql-action",
    "mysql-inscription",
    "mysql-presence",
    "mysql-recompense",
    "mysql-admin",
    "mysql-notification"
)

Write-Host "Services à démarrer:" -ForegroundColor Yellow
foreach ($service in $services) {
    Write-Host "  • $service" -ForegroundColor Gray
}
Write-Host ""

# Démarrer les services
Write-Host "Exécution de docker-compose up -d..." -ForegroundColor Green
docker-compose up -d $services

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ Infrastructure démarrée avec succès!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📊 Services disponibles:" -ForegroundColor Cyan
    Write-Host "  • Kafka → localhost:29092" -ForegroundColor White
    Write-Host "  • Kafka UI → http://localhost:8090" -ForegroundColor White
    Write-Host "  • phpMyAdmin → http://localhost:8888" -ForegroundColor White
    Write-Host ""
    
    Write-Host "💾 Bases de données MySQL:" -ForegroundColor Cyan
    Write-Host "  • mysql-auth → localhost:3316 (db_auth)" -ForegroundColor White
    Write-Host "  • mysql-utilisateur → localhost:3307 (db_utilisateur)" -ForegroundColor White
    Write-Host "  • mysql-action → localhost:3308 (db_action)" -ForegroundColor White
    Write-Host "  • mysql-inscription → localhost:3309 (db_inscription)" -ForegroundColor White
    Write-Host "  • mysql-presence → localhost:3310 (db_presence)" -ForegroundColor White
    Write-Host "  • mysql-recompense → localhost:3311 (db_recompense)" -ForegroundColor White
    Write-Host "  • mysql-admin → localhost:3312 (db_admin)" -ForegroundColor White
    Write-Host "  • mysql-notification → localhost:3313 (db_notification)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔑 Credentials MySQL:" -ForegroundColor Cyan
    Write-Host "  • Username: ecopria" -ForegroundColor White
    Write-Host "  • Password: (défini dans .env)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Attendez que tous les services soient prêts (30-60 secondes)" -ForegroundColor Gray
    Write-Host "  2. Vérifiez avec: docker ps" -ForegroundColor Gray
    Write-Host "  3. Démarrez les microservices avec: .\start-all-services.ps1" -ForegroundColor Gray
    Write-Host "     OU démarrez-les individuellement dans votre IDE" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "🔍 Vérification de l'état des conteneurs..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "kafka|mysql|phpmyadmin"
    
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du démarrage de l'infrastructure" -ForegroundColor Red
    Write-Host "Vérifiez les logs avec: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Pour arrêter l'infrastructure: docker-compose down" -ForegroundColor Gray
Write-Host ""
