# Demarre tous les microservices et le frontend en local
# Utilisation : .\start-all.ps1
# Ctrl+C pour arreter tous les services

param(
    [switch]$NoInfra = $false
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$ColorSuccess = "Green"
$ColorInfo = "Cyan"
$ColorWarn = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "=========================================================" -ForegroundColor $ColorInfo
Write-Host "    Demarrage de tous les microservices Ecopria" -ForegroundColor $ColorInfo
Write-Host "=========================================================" -ForegroundColor $ColorInfo
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[ERREUR] Fichier .env manquant. Copiez .env.example vers .env" -ForegroundColor $ColorError
    exit 1
}

# ---- ETAPE 1 : INFRA DOCKER
if (-not $NoInfra) {
    Write-Host "[1] Demarrage infrastructure Docker (MySQL + Kafka)..." -ForegroundColor $ColorInfo
    docker compose -f docker-compose.infra.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Erreur au demarrage de l'infra Docker" -ForegroundColor $ColorError
        exit 1
    }
    Write-Host "    [OK] Infra demarree" -ForegroundColor $ColorSuccess
    Start-Sleep -Seconds 3
    Write-Host ""
}

# ---- ETAPE 2 : SERVICES BACKEND
$backendServices = @(
    @{ name = "auth-service"; port = 8081; profile = "" },
    @{ name = "service-utilisateur"; port = 8082; profile = "-Dspring-boot.run.profiles=local" },
    @{ name = "service-action"; port = 9090; profile = "-Dspring-boot.run.profiles=local" },
    @{ name = "service-inscription"; port = 8084; profile = "-Dspring-boot.run.profiles=local" },
    @{ name = "service-presence"; port = 8085; profile = "-Dspring-boot.run.profiles=local" },
    @{ name = "service-recompense"; port = 9093; profile = "" },
    @{ name = "service-notification"; port = 8086; profile = "" },
    @{ name = "admin-service"; port = 8087; profile = "-Dspring-boot.run.profiles=local" }
)

Write-Host "[2] Demarrage services backend en parallele..." -ForegroundColor $ColorInfo
$processes = @()

foreach ($service in $backendServices) {
    $servicePath = Join-Path "backend" $service.name
    if (-not (Test-Path $servicePath)) {
        Write-Host "    [WARN] $($service.name) introuvable" -ForegroundColor $ColorWarn
        continue
    }
    
    Write-Host "    --> $($service.name) (port $($service.port))" -ForegroundColor $ColorInfo
    
    $mvnCmd = "mvnw.cmd spring-boot:run"
    if ($service.profile) {
        $mvnCmd += " " + $service.profile
    }
    
    $process = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd `"$servicePath`" && $mvnCmd" `
        -WindowStyle Minimized `
        -PassThru
    
    $processes += $process
    Start-Sleep -Milliseconds 500
}

Write-Host "    [OK] Services lances en arriere-plan" -ForegroundColor $ColorSuccess
Write-Host ""

Write-Host "    Attente du demarrage des services (15s)..." -ForegroundColor $ColorWarn
Start-Sleep -Seconds 15

# ---- API GATEWAY
Write-Host "[2b] Demarrage API Gateway..." -ForegroundColor $ColorInfo
$gatewayPath = Join-Path "backend" "api-gateway"
if (Test-Path $gatewayPath) {
    Write-Host "    --> api-gateway (port 8080)" -ForegroundColor $ColorInfo
    $process = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd `"$gatewayPath`" && mvnw.cmd spring-boot:run" `
        -WindowStyle Minimized `
        -PassThru
    $processes += $process
    Write-Host "    [OK] API Gateway lancee" -ForegroundColor $ColorSuccess
} else {
    Write-Host "    [WARN] API Gateway introuvable" -ForegroundColor $ColorWarn
}
Write-Host ""

# ---- FRONTEND
Write-Host "[3] Demarrage du frontend Angular..." -ForegroundColor $ColorInfo
if (Test-Path "frontend") {
    Write-Host "    --> ng serve" -ForegroundColor $ColorInfo
    $frontendProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd frontend && npm start" `
        -WindowStyle Normal `
        -PassThru
    $processes += $frontendProcess
    Write-Host "    [OK] Frontend lance" -ForegroundColor $ColorSuccess
} else {
    Write-Host "    [WARN] Dossier frontend introuvable" -ForegroundColor $ColorWarn
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor $ColorSuccess
Write-Host "            [OK] DEMARRAGE COMPLET" -ForegroundColor $ColorSuccess
Write-Host "=========================================================" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "Services en cours d'execution :" -ForegroundColor $ColorInfo
Write-Host "  API Gateway      http://localhost:8080" -ForegroundColor $ColorSuccess
Write-Host "  Frontend         http://localhost:4200" -ForegroundColor $ColorSuccess
Write-Host "  Kafka UI         http://localhost:8090" -ForegroundColor $ColorSuccess
Write-Host "  phpMyAdmin       http://localhost:8888" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "Services backend :" -ForegroundColor $ColorInfo
foreach ($service in $backendServices) {
    Write-Host "  $($service.name)     port $($service.port)" -ForegroundColor $ColorInfo
}
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter tous les services" -ForegroundColor $ColorWarn
Write-Host ""

try {
    Wait-Process -Id $processes.Id
} catch {
    Write-Host ""
    Write-Host "Arret des services..." -ForegroundColor $ColorWarn
    
    foreach ($proc in $processes) {
        if ($proc -and -not $proc.HasExited) {
            try {
                $proc | Stop-Process -Force
            } catch {
                # Ignorer les erreurs
            }
        }
    }
    
    Write-Host "Services arretes." -ForegroundColor $ColorSuccess
    exit 0
}
