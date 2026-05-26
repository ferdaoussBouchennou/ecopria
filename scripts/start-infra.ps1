# Démarre uniquement MySQL + Kafka (+ phpMyAdmin, Kafka UI)
Set-Location $PSScriptRoot\..

if (-not (Test-Path ".env")) {
    Write-Host "Copiez .env.example vers .env puis relancez." -ForegroundColor Yellow
    exit 1
}

Write-Host "Demarrage infra Docker (BDD + Kafka)..." -ForegroundColor Cyan
docker compose -f docker-compose.infra.yml up -d

Write-Host ""
Write-Host "Infra prete :" -ForegroundColor Green
Write-Host "  Kafka UI      http://localhost:8090"
Write-Host "  phpMyAdmin    http://localhost:8888"
Write-Host "  Kafka broker  localhost:29092"
Write-Host ""
Write-Host "Ensuite : lancez les microservices en local (voir DEV-LOCAL.md)"
