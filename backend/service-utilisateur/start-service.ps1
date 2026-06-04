# Script pour démarrer le service avec la bonne version de Java

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DÉMARRAGE SERVICE-UTILISATEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier la version de Java
Write-Host "Version de Java détectée:" -ForegroundColor Yellow
java -version
Write-Host ""

Write-Host "ATTENTION: Le projet nécessite Java 21, pas Java 25" -ForegroundColor Yellow
Write-Host ""

Write-Host "Solutions:" -ForegroundColor Cyan
Write-Host "1. Installer Java 21 (recommandé)" -ForegroundColor White
Write-Host "2. Utiliser JAVA_HOME pour pointer vers Java 21" -ForegroundColor White
Write-Host "3. Modifier le pom.xml pour Java 25 (non recommandé)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Voulez-vous essayer de démarrer quand même ? (O/N)"

if ($choice -eq "O" -or $choice -eq "o") {
    Write-Host ""
    Write-Host "Tentative de démarrage..." -ForegroundColor Yellow
    ./mvnw spring-boot:run
} else {
    Write-Host ""
    Write-Host "Installation de Java 21:" -ForegroundColor Cyan
    Write-Host "1. Téléchargez depuis: https://adoptium.net/temurin/releases/?version=21" -ForegroundColor White
    Write-Host "2. Installez Java 21" -ForegroundColor White
    Write-Host "3. Définissez JAVA_HOME vers Java 21" -ForegroundColor White
    Write-Host ""
}
