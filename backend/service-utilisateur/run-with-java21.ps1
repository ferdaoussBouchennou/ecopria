# Script pour démarrer le service avec Java 21
# Nécessite d'avoir Java 21 installé

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SERVICE-UTILISATEUR avec Java 21" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Chemins possibles de Java 21
$possibleJava21Paths = @(
    "C:\Program Files\Java\jdk-21\bin\java.exe",
    "C:\Program Files\Eclipse Adoptium\jdk-21\bin\java.exe",
    "C:\Program Files\Microsoft\jdk-21\bin\java.exe",
    "C:\Program Files\Amazon Corretto\jdk21\bin\java.exe",
    "$env:JAVA_HOME\bin\java.exe"
)

$java21Path = $null

foreach ($path in $possibleJava21Paths) {
    if (Test-Path $path) {
        # Vérifier que c'est bien Java 21
        $version = & $path -version 2>&1 | Select-String "21\."
        if ($version) {
            $java21Path = $path
            Write-Host "✅ Java 21 trouvé: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $java21Path) {
    Write-Host "❌ Java 21 non trouvé!" -ForegroundColor Red
    Write-Host "`nChemins vérifiés:" -ForegroundColor Yellow
    foreach ($path in $possibleJava21Paths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    Write-Host "`nSolutions:" -ForegroundColor Yellow
    Write-Host "1. Installer Java 21: https://adoptium.net/" -ForegroundColor Cyan
    Write-Host "2. Ou utiliser Docker: ..\..\..\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1" -ForegroundColor Cyan
    exit 1
}

# Définir JAVA_HOME temporairement
$javaHome = Split-Path (Split-Path $java21Path)
$env:JAVA_HOME = $javaHome

Write-Host "JAVA_HOME: $javaHome" -ForegroundColor Cyan
Write-Host "`nDémarrage du service...`n" -ForegroundColor Yellow

# Démarrer avec Maven
try {
    & ./mvnw spring-boot:run
} catch {
    Write-Host "`n❌ Erreur lors du démarrage" -ForegroundColor Red
    exit 1
}
