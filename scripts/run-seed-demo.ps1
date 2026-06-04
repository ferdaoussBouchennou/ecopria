# Charge les données de démo sur chaque MySQL (ports hôte docker-compose.infra.yml)
# Prérequis : docker compose -f docker-compose.infra.yml up -d
# Usage : .\scripts\run-seed-demo.ps1

$ErrorActionPreference = "Stop"
$user = "ecopria"
$pass = "ecopria_pass_2026"
$hostName = "127.0.0.1"
$root = Split-Path $PSScriptRoot -Parent
$mainSql = Join-Path $PSScriptRoot "seed-demo-complet.sql"
$recompenseSql = Join-Path $root "backend\service-recompense\data-demo.sql"

function Get-DbSection([string]$content, [string]$dbMarker) {
    $pattern = "(?s)(-- =+\s*\r?\n-- $([regex]::Escape($dbMarker)).*?)(?=\r?\n-- =+\s*\r?\n-- \d+\) db_|\r?\n-- FIN|\z)"
    if ($content -match $pattern) { return $Matches[1] }
    throw "Section introuvable : $dbMarker"
}

function Invoke-Section([int]$port, [string]$sql) {
    $tmp = [System.IO.Path]::GetTempFileName() + ".sql"
    Set-Content -Path $tmp -Value $sql -Encoding UTF8
    Write-Host ">> port $port"
    & mysql -h $hostName -P $port -u $user "-p$pass" --default-character-set=utf8mb4 < $tmp
    if ($LASTEXITCODE -ne 0) { throw "mysql a échoué (port $port)" }
    Remove-Item $tmp -Force
}

$full = Get-Content $mainSql -Raw

Invoke-Section 3316 (Get-DbSection $full "0) db_auth")
Invoke-Section 3307 (Get-DbSection $full "1) db_utilisateur")
Invoke-Section 3308 (Get-DbSection $full "2) db_action")
Invoke-Section 3309 (Get-DbSection $full "3) db_inscription")
Invoke-Section 3310 (Get-DbSection $full "4) db_presence")

Write-Host ">> port 3311 (data-demo.sql)"
& mysql -h $hostName -P 3311 -u $user "-p$pass" --default-character-set=utf8mb4 < $recompenseSql
if ($LASTEXITCODE -ne 0) { throw "mysql a échoué (data-demo)" }

Invoke-Section 3311 (Get-DbSection $full "5) db_recompense")
Invoke-Section 3312 (Get-DbSection $full "6) db_admin")

Write-Host ""
Write-Host "OK — Citoyen : tafraouti.sanae1@gmail.com / Admin123!"
Write-Host "     Asso   : asso@ecopria.demo / Admin123!"
