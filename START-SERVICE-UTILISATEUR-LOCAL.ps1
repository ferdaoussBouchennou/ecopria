# Script pour démarrer le Service-Utilisateur en LOCAL (pas Docker)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DÉMARRAGE SERVICE-UTILISATEUR (LOCAL)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$SERVICE_DIR = "backend\service-utilisateur"

# Vérifier que Maven est installé
Write-Host "[1/4] Vérification de Maven..." -ForegroundColor Yellow
try {
    $mvnVersion = & mvn -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Maven non trouvé"
    }
    Write-Host "  Maven OK" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: Maven n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "  Installez Maven: https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    exit 1
}

# Vérifier que MySQL est accessible
Write-Host "`n[2/4] Vérification de MySQL (port 3307)..." -ForegroundColor Yellow
try {
    $mysqlTest = & mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026 -e "SELECT 1" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL non accessible"
    }
    Write-Host "  MySQL OK" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: MySQL non accessible sur le port 3307" -ForegroundColor Red
    Write-Host "  Démarrez MySQL avec Docker: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Compiler le service
Write-Host "`n[3/4] Compilation du service..." -ForegroundColor Yellow
Set-Location $SERVICE_DIR
try {
    & mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        throw "Compilation échouée"
    }
    Write-Host "  Compilation réussie" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR lors de la compilation" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

# Démarrer le service
Write-Host "`n[4/4] Démarrage du service sur le port 8082..." -ForegroundColor Yellow
Write-Host "  Appuyez sur Ctrl+C pour arrêter le service`n" -ForegroundColor Cyan

try {
    & mvn spring-boot:run
} catch {
    Write-Host "`n Service arrêté" -ForegroundColor Yellow
} finally {
    Set-Location ..\..
}
