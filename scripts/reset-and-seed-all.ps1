# Reset toutes les bases MySQL Docker + recharge scripts/seed-demo-complet.sql (fichier unique)
# Prerequis : docker compose -f docker-compose.infra.yml up -d
# Usage : .\scripts\reset-and-seed-all.ps1

$ErrorActionPreference = "Continue"
$mysqlUser = "ecopria"
$mysqlPass = "ecopria_pass_2026"
$mainSql = Join-Path $PSScriptRoot "seed-demo-complet.sql"
$pwdLine = 'SET @pwd := ''$2a$10$uPXNpUOU2bjTTnbVz0KA1eSrj9X8oS4gh.ubvs37jA0Nr4PtA5pH.'';'

function Get-DbSection([string]$content, [string]$dbMarker) {
    $pattern = "(?s)(--[^\n]*\r?\n-- $([regex]::Escape($dbMarker)).*?)(?=\r?\n--[^\n]*\r?\n-- \d+\) db_|\r?\n-- FIN|\z)"
    if ($content -match $pattern) { return $Matches[1] }
    throw "Section introuvable : $dbMarker"
}

function Invoke-DockerMysql([string]$container, [string]$sql, [string]$label) {
    Write-Host ">> $label ($container)"
    $tmp = Join-Path $env:TEMP ("ecopria-seed-{0}.sql" -f [guid]::NewGuid().ToString('N'))
    $utf8 = New-Object System.Text.UTF8Encoding $true
    [System.IO.File]::WriteAllText($tmp, $sql, $utf8)
    $remote = "/tmp/ecopria-seed.sql"
    docker cp $tmp "${container}:${remote}" | Out-Null
    $output = docker exec $container mysql "-u$mysqlUser" "-p$mysqlPass" --default-character-set=utf8mb4 -e "source $remote" 2>&1
    docker exec $container rm -f $remote 2>$null | Out-Null
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    $errors = @($output | ForEach-Object { "$_" } | Where-Object { $_ -match '^ERROR' })
    if ($errors.Count -gt 0) {
        $errors | ForEach-Object { Write-Host $_ }
        throw "mysql a echoue ($container)"
    }
}

function Get-TableNames([string]$container, [string]$dbName) {
    $listCmd = "SELECT table_name FROM information_schema.tables WHERE table_schema='$dbName' AND table_type='BASE TABLE';"
    $raw = docker exec $container mysql "-u$mysqlUser" "-p$mysqlPass" -N -e $listCmd 2>&1
    return @($raw | ForEach-Object { "$_" } | Where-Object { $_ -notmatch 'Warning' -and $_.Trim() -ne '' })
}

function Reset-Database([string]$container, [string]$dbName) {
    Write-Host ">> RESET $dbName ($container)"
    $tables = Get-TableNames $container $dbName
    foreach ($t in $tables) {
        $truncateCmd = "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE ``$t``; SET FOREIGN_KEY_CHECKS=1;"
        docker exec $container mysql "-u$mysqlUser" "-p$mysqlPass" -e $truncateCmd $dbName 2>$null | Out-Null
    }
    Write-Host "   $($tables.Count) table(s) videe(s)"
}

$containers = @(
    @{ c = "mysql-auth"; db = "db_auth" },
    @{ c = "mysql-utilisateur"; db = "db_utilisateur" },
    @{ c = "mysql-action"; db = "db_action" },
    @{ c = "mysql-inscription"; db = "db_inscription" },
    @{ c = "mysql-presence"; db = "db_presence" },
    @{ c = "mysql-recompense"; db = "db_recompense" },
    @{ c = "mysql-admin"; db = "db_admin" },
    @{ c = "mysql-notification"; db = "db_notification" }
)

Write-Host "=== 1/2 - Vidage de toutes les bases ==="
foreach ($item in $containers) {
    Reset-Database $item.c $item.db
}

Write-Host ""
Write-Host "=== 2/2 - Rechargement seed-demo-complet.sql ==="
$full = Get-Content $mainSql -Raw -Encoding UTF8

$authSection = Get-DbSection $full '0) db_auth'
$authSql = $pwdLine + "`n" + $authSection
Invoke-DockerMysql "mysql-auth" $authSql "db_auth"
Invoke-DockerMysql "mysql-utilisateur" (Get-DbSection $full '1) db_utilisateur') "db_utilisateur"
Invoke-DockerMysql "mysql-action" (Get-DbSection $full '2) db_action') "db_action"
Invoke-DockerMysql "mysql-inscription" (Get-DbSection $full '3) db_inscription') "db_inscription"
Invoke-DockerMysql "mysql-presence" (Get-DbSection $full '4) db_presence') "db_presence"
Invoke-DockerMysql "mysql-recompense" (Get-DbSection $full '5) db_recompense') "db_recompense"
Invoke-DockerMysql "mysql-admin" (Get-DbSection $full '6) db_admin') "db_admin"
Invoke-DockerMysql "mysql-notification" (Get-DbSection $full '7) db_notification') "db_notification"

Write-Host ""
Write-Host "OK - Bases rechargees (fichier unique seed-demo-complet.sql)."
Write-Host ""
Write-Host "Comptes (mot de passe: Admin123!)"
Write-Host "  Citoyen    : tafraouti.sanae1@gmail.com"
Write-Host "  Association: asso@ecopria.demo"
Write-Host "  Admin      : admin@ecopria.local"
Write-Host "  Partenaire : partenaire101@ecopria.demo"
