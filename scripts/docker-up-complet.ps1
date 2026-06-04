# Démarre la stack COMPLÈTE (docker-compose.yml) de façon fiable pour phpMyAdmin
# Usage : .\scripts\docker-up-complet.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not (Test-Path ".env")) {
    Write-Host "Fichier .env manquant. Copie de .env.example..."
    Copy-Item ".env.example" ".env"
}

Write-Host "1/3 — Demarrage infra (Kafka + MySQL + phpMyAdmin)..."
docker compose up -d kafka mysql-auth mysql-utilisateur mysql-action mysql-inscription `
  mysql-presence mysql-recompense mysql-admin mysql-notification phpmyadmin kafka-ui

Write-Host "Attente sante MySQL (max 2 min)..."
$deadline = (Get-Date).AddMinutes(2)
do {
    Start-Sleep -Seconds 5
    $auth = docker inspect -f "{{.State.Health.Status}}" mysql-auth 2>$null
    if ($auth -eq "healthy") { break }
} while ((Get-Date) -lt $deadline)

Write-Host "2/3 — Redemarrage phpMyAdmin (resolution DNS mysql-auth)..."
docker compose restart phpmyadmin

Write-Host "3/3 — Demarrage des microservices..."
docker compose up -d

Write-Host ""
Write-Host "phpMyAdmin : http://localhost:8888"
Write-Host "Serveurs   : mysql-auth, mysql-action, mysql-inscription, ..."
Write-Host "Login      : root / ecopria_root_2026  (ou ecopria / ecopria_pass_2026)"
Write-Host "Verifier   : docker compose ps"
