# Script de test des commissions
# Vérifie que les commissions sont bien calculées

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST DES COMMISSIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:8083"
$dbHost = "localhost"
$dbPort = "3311"
$dbName = "db_recompense"
$dbUser = "ecopria"
$dbPass = "ecopria_pass_2026"

Write-Host "1. Vérification du service-recompense..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/actuator/health" -ErrorAction Stop
    Write-Host "   ✓ Service actif: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Service non accessible sur $baseUrl" -ForegroundColor Red
    Write-Host "   Démarrez le service avec: cd backend\service-recompense & mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Instructions pour tester..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ÉTAPE A: Préparer les données" -ForegroundColor Cyan
Write-Host "   -------------------------" -ForegroundColor Gray
Write-Host "   1. Ouvrir phpMyAdmin: http://localhost:8080" -ForegroundColor White
Write-Host "   2. Sélectionner: db_recompense" -ForegroundColor White
Write-Host "   3. Exécuter: diagnostic-commissions.sql" -ForegroundColor White
Write-Host "   4. Noter la structure de la table (colonnes)" -ForegroundColor White
Write-Host "   5. Exécuter: corriger-commissions-simple.sql" -ForegroundColor White
Write-Host ""

Write-Host "   ÉTAPE B: Tester la validation" -ForegroundColor Cyan
Write-Host "   -------------------------" -ForegroundColor Gray
Write-Host "   1. Aller sur: http://localhost:4200" -ForegroundColor White
Write-Host "   2. Se connecter comme citoyen" -ForegroundColor White
Write-Host "   3. Échanger une récompense" -ForegroundColor White
Write-Host "   4. Noter le code coupon" -ForegroundColor White
Write-Host "   5. Se connecter comme partenaire" -ForegroundColor White
Write-Host "   6. Scanner/valider le coupon" -ForegroundColor White
Write-Host ""

Write-Host "   ÉTAPE C: Vérifier les logs" -ForegroundColor Cyan
Write-Host "   -------------------------" -ForegroundColor Gray
Write-Host "   Dans le terminal service-recompense, chercher:" -ForegroundColor White
Write-Host "   'Commission X DH calculée pour coupon ABC123'" -ForegroundColor Green
Write-Host "   OU" -ForegroundColor Yellow
Write-Host "   'Aucune commission calculée pour coupon ABC123'" -ForegroundColor Red
Write-Host ""

Write-Host "   ÉTAPE D: Vérifier dans phpMyAdmin" -ForegroundColor Cyan
Write-Host "   -------------------------" -ForegroundColor Gray
Write-Host "   Exécuter cette requête:" -ForegroundColor White
Write-Host ""
Write-Host "   SELECT * FROM commissions" -ForegroundColor Gray
Write-Host "   ORDER BY created_at DESC" -ForegroundColor Gray
Write-Host "   LIMIT 5;" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AIDE AU DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Si aucune commission n'est calculée:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Vérifier le taux du partenaire:" -ForegroundColor White
Write-Host "   SELECT id, name, commission_rate FROM partenaires;" -ForegroundColor Gray
Write-Host "   → Doit être > 0 (ex: 10.0)" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Vérifier les récompenses:" -ForegroundColor White
Write-Host "   SELECT id, title, type, valeur_dh, discount_percentage" -ForegroundColor Gray
Write-Host "   FROM recompenses WHERE is_active = 1;" -ForegroundColor Gray
Write-Host "   → valeur_dh et discount_percentage doivent être remplis" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Vérifier les logs:" -ForegroundColor White
Write-Host "   Chercher 'validerCoupon' dans le terminal service-recompense" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REQUÊTES UTILES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "-- Voir les coupons sans commission" -ForegroundColor Gray
Write-Host "SELECT c.code, r.title, p.name, c.valide_le" -ForegroundColor Gray
Write-Host "FROM coupons c" -ForegroundColor Gray
Write-Host "JOIN recompenses r ON c.recompense_id = r.id" -ForegroundColor Gray
Write-Host "JOIN partenaires p ON r.partenaire_id = p.id" -ForegroundColor Gray
Write-Host "LEFT JOIN commissions com ON com.coupon_id = c.id" -ForegroundColor Gray
Write-Host "WHERE c.status = 'UTILISE' AND com.id IS NULL;" -ForegroundColor Gray
Write-Host ""

Write-Host "-- Résumé par partenaire" -ForegroundColor Gray
Write-Host "SELECT p.name, COUNT(com.id) as nb," -ForegroundColor Gray
Write-Host "       SUM(com.montant_commission) as total" -ForegroundColor Gray
Write-Host "FROM partenaires p" -ForegroundColor Gray
Write-Host "LEFT JOIN commissions com ON com.partenaire_id = p.id" -ForegroundColor Gray
Write-Host "GROUP BY p.id, p.name;" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "POUR PLUS D'AIDE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lire: EXECUTER-DANS-CET-ORDRE.md" -ForegroundColor White
Write-Host "Lire: RESOUDRE-PROBLEME-COMMISSIONS.md" -ForegroundColor White
Write-Host ""
