# Script pour vérifier les commissions

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VÉRIFICATION DES COMMISSIONS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier les partenaires et leurs taux de commission
Write-Host "[1/4] Partenaires et taux de commission:" -ForegroundColor Yellow
$query1 = @"
SELECT 
    id,
    user_id,
    name,
    commission_rate as 'Taux %'
FROM partenaires
ORDER BY id;
"@

mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense -e $query1

# Vérifier les récompenses avec leurs valeurs
Write-Host "`n[2/4] Récompenses et valeurs:" -ForegroundColor Yellow
$query2 = @"
SELECT 
    id,
    title,
    type,
    points_necessaires as 'Points',
    discount_percentage as 'Remise %',
    valeur_dh as 'Valeur DH',
    stock,
    is_active
FROM recompenses
WHERE is_active = 1
ORDER BY id;
"@

mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense -e $query2

# Vérifier les coupons utilisés
Write-Host "`n[3/4] Coupons utilisés récemment:" -ForegroundColor Yellow
$query3 = @"
SELECT 
    c.code,
    c.status,
    c.points_utilises as 'Points',
    r.title as 'Récompense',
    c.valide_le as 'Validé le'
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
WHERE c.status = 'UTILISE'
ORDER BY c.valide_le DESC
LIMIT 5;
"@

mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense -e $query3

# Vérifier les commissions calculées
Write-Host "`n[4/4] Commissions calculées:" -ForegroundColor Yellow
$query4 = @"
SELECT 
    com.id,
    p.name as 'Partenaire',
    cou.code as 'Code Coupon',
    com.valeur_dh as 'Valeur Base DH',
    com.taux_commission as 'Taux %',
    com.montant_commission as 'Commission DH',
    com.created_at as 'Date'
FROM commissions com
JOIN partenaires p ON com.partenaire_id = p.id
JOIN coupons cou ON com.coupon_id = cou.id
ORDER BY com.created_at DESC
LIMIT 10;
"@

mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense -e $query4

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ANALYSE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Pour qu'une commission soit calculée, il faut:" -ForegroundColor White
Write-Host "  1. Le partenaire doit avoir un commission_rate > 0" -ForegroundColor Gray
Write-Host "  2. La récompense doit avoir:" -ForegroundColor Gray
Write-Host "     - discount_percentage ET valeur_dh définis" -ForegroundColor Gray
Write-Host "     OU être de type REDUCTION avec valeur_dh" -ForegroundColor Gray

Write-Host "`nFormule de calcul:" -ForegroundColor White
Write-Host "  Type REDUCTION:" -ForegroundColor Gray
Write-Host "    Commission = valeur_dh * commission_rate / 100" -ForegroundColor Cyan
Write-Host "`n  Autres types (avec remise):" -ForegroundColor Gray
Write-Host "    Base = valeur_dh * discount_percentage / 100" -ForegroundColor Cyan
Write-Host "    Commission = Base * commission_rate / 100" -ForegroundColor Cyan

Write-Host "`n========================================`n" -ForegroundColor Cyan
