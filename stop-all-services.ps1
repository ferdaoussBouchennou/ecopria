# Script PowerShell pour arrêter tous les microservices Ecopria

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Arrêt des Microservices Ecopria      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Liste des ports utilisés par les services
$ports = @(8080, 8081, 8082, 8084, 8085, 8086, 8087, 9090, 9093)

Write-Host "Recherche des processus Java sur les ports des microservices..." -ForegroundColor Yellow
Write-Host ""

$stoppedCount = 0

foreach ($port in $ports) {
    # Trouver le processus qui utilise ce port
    $connection = netstat -ano | Select-String ":$port " | Select-Object -First 1
    
    if ($connection) {
        # Extraire le PID (dernier élément de la ligne)
        $pid = ($connection -split '\s+')[-1]
        
        # Vérifier que c'est bien un processus Java
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "🛑 Arrêt du service sur le port $port (PID: $pid)" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            $stoppedCount++
        }
    }
}

Write-Host ""
if ($stoppedCount -gt 0) {
    Write-Host "✅ $stoppedCount service(s) arrêté(s)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun service en cours d'exécution" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Note: Les fenêtres PowerShell des services peuvent rester ouvertes." -ForegroundColor Gray
Write-Host "Vous pouvez les fermer manuellement." -ForegroundColor Gray
Write-Host ""
