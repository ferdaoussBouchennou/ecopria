-- ==========================================
-- DIAGNOSTIC COMPLET DES COMMISSIONS
-- ==========================================

USE db_recompense;

-- ==========================================
-- 1. STRUCTURE DE LA TABLE COMMISSIONS
-- ==========================================
SELECT 'STRUCTURE TABLE COMMISSIONS' as '';
DESCRIBE commissions;

-- ==========================================
-- 2. VÉRIFIER LES PARTENAIRES
-- ==========================================
SELECT 'PARTENAIRES ET LEURS TAUX' as '';

SELECT 
    id,
    user_id,
    name,
    commission_rate,
    CASE 
        WHEN commission_rate IS NULL THEN '❌ NULL'
        WHEN commission_rate = 0 THEN '❌ ZÉRO'
        ELSE '✅ OK'
    END as Status
FROM partenaires;

-- ==========================================
-- 3. VÉRIFIER LES RÉCOMPENSES ACTIVES
-- ==========================================
SELECT 'RÉCOMPENSES ACTIVES' as '';

SELECT 
    r.id,
    r.title,
    r.type,
    r.points_necessaires,
    r.discount_percentage,
    r.valeur_dh,
    p.name as partenaire,
    p.commission_rate,
    CASE 
        WHEN r.valeur_dh IS NULL THEN '❌ Pas de valeur_dh'
        WHEN p.commission_rate IS NULL OR p.commission_rate = 0 THEN '❌ Pas de taux'
        WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN '✅ OK (REDUCTION)'
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL THEN '✅ OK'
        ELSE '❌ Données manquantes'
    END as Calculable
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE r.is_active = 1
ORDER BY r.id;

-- ==========================================
-- 4. COUPONS VALIDÉS (10 DERNIERS)
-- ==========================================
SELECT 'DERNIERS COUPONS VALIDÉS' as '';

SELECT 
    c.id as coupon_id,
    c.code,
    c.status,
    c.valide_le,
    r.title as recompense,
    r.type,
    r.valeur_dh,
    r.discount_percentage,
    p.name as partenaire,
    p.commission_rate,
    CASE 
        WHEN EXISTS(SELECT 1 FROM commissions WHERE coupon_id = c.id) 
        THEN '✅ Commission OK'
        ELSE '❌ PAS DE COMMISSION'
    END as Commission_Status
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
WHERE c.status = 'UTILISE'
ORDER BY c.valide_le DESC
LIMIT 10;

-- ==========================================
-- 5. COMMISSIONS EXISTANTES
-- ==========================================
SELECT 'COMMISSIONS DÉJÀ CRÉÉES' as '';

SELECT 
    com.id,
    p.name as partenaire,
    c.code as coupon,
    r.title as recompense,
    com.valeur_dh as base,
    com.taux_commission as taux,
    com.montant_commission as montant,
    com.created_at
FROM commissions com
JOIN partenaires p ON com.partenaire_id = p.id
JOIN coupons c ON com.coupon_id = c.id
JOIN recompenses r ON c.recompense_id = r.id
ORDER BY com.created_at DESC
LIMIT 10;

-- ==========================================
-- 6. COUPONS SANS COMMISSION + DÉTAILS
-- ==========================================
SELECT 'DÉTAIL DES COUPONS SANS COMMISSION' as '';

SELECT 
    c.id as coupon_id,
    c.code,
    c.valide_le,
    p.id as partenaire_id,
    p.name as partenaire,
    p.commission_rate,
    r.id as recompense_id,
    r.title as recompense,
    r.type,
    r.valeur_dh,
    r.discount_percentage,
    -- Calcul de base
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
        THEN r.valeur_dh * r.discount_percentage / 100.0
        ELSE NULL
    END as base_calculee,
    -- Commission attendue
    CASE 
        WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL AND p.commission_rate > 0
        THEN r.valeur_dh * p.commission_rate / 100.0
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL AND p.commission_rate > 0
        THEN (r.valeur_dh * r.discount_percentage / 100.0) * p.commission_rate / 100.0
        ELSE NULL
    END as commission_attendue,
    -- Raison
    CASE 
        WHEN p.commission_rate IS NULL OR p.commission_rate = 0 THEN 'Taux commission = 0'
        WHEN r.valeur_dh IS NULL THEN 'valeur_dh manquante'
        WHEN r.type != 'REDUCTION' AND r.discount_percentage IS NULL THEN 'discount_percentage manquant'
        ELSE 'Devrait fonctionner'
    END as raison
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
ORDER BY c.valide_le DESC;

-- ==========================================
-- 7. STATISTIQUES GLOBALES
-- ==========================================
SELECT 'STATISTIQUES' as '';

SELECT 
    (SELECT COUNT(*) FROM partenaires) as total_partenaires,
    (SELECT COUNT(*) FROM partenaires WHERE commission_rate > 0) as partenaires_avec_taux,
    (SELECT COUNT(*) FROM recompenses WHERE is_active = 1) as recompenses_actives,
    (SELECT COUNT(*) FROM coupons WHERE status = 'UTILISE') as coupons_utilises,
    (SELECT COUNT(*) FROM commissions) as commissions_creees,
    (SELECT COUNT(*) FROM coupons c LEFT JOIN commissions com ON c.id = com.coupon_id WHERE c.status = 'UTILISE' AND com.id IS NULL) as coupons_sans_commission;

-- ==========================================
-- FIN DU DIAGNOSTIC
-- ==========================================
