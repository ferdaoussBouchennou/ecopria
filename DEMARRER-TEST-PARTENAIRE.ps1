# ============================================================
# Script PowerShell : Démarrer les services pour tester
# les modifications de l'espace partenaire
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMARRAGE TEST ESPACE PARTENAIRE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier le répertoire actuel
$currentPath = Get-Location
Write-Host "Repertoire actuel : $currentPath" -ForegroundColor Yellow

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path ".\frontend")) {
    Write-Host "ERREUR : Le dossier 'frontend' n'existe pas ici." -ForegroundColor Red
    Write-Host "Veuillez executer ce script depuis le dossier racine du projet (ecopria)." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Etape 1/4 : Verification MySQL ===" -ForegroundColor Green

# Vérifier MySQL
$mysqlProcess = Get-Process mysqld -ErrorAction SilentlyContinue
if ($mysqlProcess) {
    Write-Host "[OK] MySQL est en cours d'execution" -ForegroundColor Green
} else {
    Write-Host "[!] MySQL ne semble pas demarrer" -ForegroundColor Yellow
    Write-Host "    Veuillez demarrer MySQL manuellement" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Etape 2/4 : Verification bases de donnees ===" -ForegroundColor Green

# Lister les bases de données
Write-Host "Verification des bases de donnees..." -ForegroundColor Yellow
$checkDbScript = @"
SELECT SCHEMA_NAME FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME IN ('ecopria_utilisateur', 'ecopria_recompense');
"@

$dbsExist = $false
try {
    $result = mysql -u root -p -e $checkDbScript 2>&1
    if ($result -match "ecopria_utilisateur" -and $result -match "ecopria_recompense") {
        Write-Host "[OK] Bases de donnees ecopria_utilisateur et ecopria_recompense existent" -ForegroundColor Green
        $dbsExist = $true
    }
} catch {
    Write-Host "[!] Impossible de verifier les bases de donnees" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Etape 3/4 : Demarrage des services backend ===" -ForegroundColor Green

# Gateway
Write-Host ""
Write-Host "[1/4] Demarrage Gateway..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\backend\gateway'; Write-Host 'SERVICE GATEWAY' -ForegroundColor Magenta; mvn spring-boot:run"
Start-Sleep -Seconds 3

# Service Utilisateur  
Write-Host "[2/4] Demarrage Service Utilisateur..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\backend\service-utilisateur'; Write-Host 'SERVICE UTILISATEUR' -ForegroundColor Magenta; mvn spring-boot:run"
Start-Sleep -Seconds 3

# Service Récompense
Write-Host "[3/4] Demarrage Service Recompense..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\backend\service-recompense'; Write-Host 'SERVICE RECOMPENSE' -ForegroundColor Magenta; mvn spring-boot:run"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=== Etape 4/4 : Demarrage Frontend ===" -ForegroundColor Green
Write-Host ""
Write-Host "[4/4] Demarrage Frontend Angular..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\frontend'; Write-Host 'FRONTEND ANGULAR' -ForegroundColor Magenta; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVICES EN COURS DE DEMARRAGE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Veuillez attendre environ 60-90 secondes pour que tous les services soient prets." -ForegroundColor Yellow
Write-Host ""
Write-Host "URLs des services :" -ForegroundColor Green
Write-Host "  - Gateway          : http://localhost:8080" -ForegroundColor White
Write-Host "  - Service Utilisateur : http://localhost:8081" -ForegroundColor White
Write-Host "  - Service Recompense  : http://localhost:8082" -ForegroundColor White
Write-Host "  - Frontend         : http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "Une fois tous les services demarres :" -ForegroundColor Yellow
Write-Host "  1. Ouvrir http://localhost:4200" -ForegroundColor Cyan
Write-Host "  2. Se connecter avec : partenaire@test.com / test123" -ForegroundColor Cyan
Write-Host "  3. Tester Scanner : /partenaire/scanner" -ForegroundColor Cyan
Write-Host "  4. Tester Commissions : /partenaire/commissions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation de test :" -ForegroundColor Yellow
Write-Host "  - TEST-MODIFICATIONS-PARTENAIRE.md (guide complet)" -ForegroundColor White
Write-Host "  - RESUME-MODIFICATIONS-PARTENAIRE.md (resume rapide)" -ForegroundColor White
Write-Host ""
Write-Host "Pour verifier les commissions dans la BD :" -ForegroundColor Yellow
Write-Host "  mysql -u root -p < verifier-commissions-mois-courant.sql" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
