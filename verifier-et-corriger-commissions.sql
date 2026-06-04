-- ==========================================
-- VÉRIFICATION ET CORRECTION DES COMMISSIONS
-- ==========================================
-- Exécutez ce script dans phpMyAdmin ou MySQL Workbench
-- Base de données: db_recompense

USE db_recompense;

-- ==========================================
-- 1. VÉRIFIER LES PARTENAIRES
-- ==========================================
SELECT 
    '=== PARTENAIRES ET TAUX DE COMMISSION ===' as '';

SELECT 
    id,
    user_id,
    name,
    commission_rate as 'Taux %',
    CASE 
        WHEN commission_rate IS NULL OR commission_rate = 0 
        THEN '❌ PAS DE TAUX' 
        ELSE '✅ OK' 
    END as 'Status'
FROM partenaires
ORDER BY id;

-- ==========================================
-- 2. CORRIGER LES TAUX SI NÉCESSAIRE
-- ==========================================
-- Mettre à jour les partenaires sans taux de commission
-- Taux par défaut: 10%

UPDATE partenaires 
SET commission_rate = 10.0 
WHERE commission_rate IS NULL OR commission_rate = 0;

SELECT 
    '=== TAUX MIS À JOUR ===' as '';

SELECT 
    id,
    name,
    commission_rate as 'Nouveau Taux %'
FROM partenaires
ORDER BY id;

-- ==========================================
-- 3. VÉRIFIER LES RÉCOMPENSES
-- ==========================================
SELECT 
    '=== RÉCOMPENSES ET VALEURS ===' as '';

SELECT 
    id,
    title,
    type,
    points_necessaires as 'Points',
    discount_percentage as 'Remise %',
    valeur_dh as 'Valeur DH',
    CASE 
        WHEN (discount_percentage IS NOT NULL AND valeur_dh IS NOT NULL) 
            OR (type = 'REDUCTION' AND valeur_dh IS NOT NULL)
        THEN '✅ Commission calculable' 
        ELSE '❌ Pas de valeur'
    END as 'Status'
FROM recompenses
WHERE is_active = 1
ORDER BY id;

-- ==========================================
-- 4. CORRIGER LES RÉCOMPENSES SI NÉCESSAIRE
-- ==========================================
-- Exemple: Mettre des valeurs par défaut
-- À adapter selon vos récompenses réelles

-- Pour les offres STOCK sans valeur
UPDATE recompenses 
SET 
    valeur_dh = points_necessaires * 0.1,  -- 10 DH par 100 points
    discount_percentage = 100  -- 100% gratuit
WHERE type = 'STOCK' 
  AND valeur_dh IS NULL
  AND is_active = 1;

-- Pour les offres REDUCTION sans valeur
UPDATE recompenses 
SET valeur_dh = points_necessaires * 0.05  -- 5 DH par 100 points
WHERE type = 'REDUCTION' 
  AND valeur_dh IS NULL
  AND is_active = 1;

SELECT 
    '=== RÉCOMPENSES MISES À JOUR ===' as '';

SELECT 
    id,
    title,
    type,
    discount_percentage as 'Remise %',
    valeur_dh as 'Valeur DH'
FROM recompenses
WHERE is_active = 1
ORDER BY id;

-- ==========================================
-- 5. VÉRIFIER LES COUPONS UTILISÉS
-- ==========================================
SELECT 
    '=== COUPONS UTILISÉS ===' as '';

SELECT 
    c.id,
    c.code,
    c.status,
    r.title as 'Récompense',
    r.valeur_dh as 'Valeur DH',
    p.commission_rate as 'Taux %',
    c.valide_le as 'Validé le'
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
WHERE c.status = 'UTILISE'
ORDER BY c.valide_le DESC
LIMIT 10;

-- ==========================================
-- 6. VÉRIFIER LES COMMISSIONS EXISTANTES
-- ==========================================
SELECT 
    '=== COMMISSIONS CALCULÉES ===' as '';

SELECT 
    com.id,
    p.name as 'Partenaire',
    cou.code as 'Code Coupon',
    r.title as 'Récompense',
    com.valeur_dh as 'Base DH',
    com.taux_commission as 'Taux %',
    com.montant_commission as 'Commission DH',
    DATE_FORMAT(com.created_at, '%Y-%m-%d %H:%i') as 'Date'
FROM commissions com
JOIN partenaires p ON com.partenaire_id = p.id
JOIN coupons cou ON com.coupon_id = cou.id
JOIN recompenses r ON cou.recompense_id = r.id
ORDER BY com.created_at DESC
LIMIT 10;

-- ==========================================
-- 7. COUPONS SANS COMMISSION (À CORRIGER)
-- ==========================================
SELECT 
    '=== COUPONS UTILISÉS SANS COMMISSION ===' as '';

SELECT 
    c.id,
    c.code,
    r.title as 'Récompense',
    r.valeur_dh as 'Valeur DH',
    r.discount_percentage as 'Remise %',
    p.name as 'Partenaire',
    p.commission_rate as 'Taux %',
    c.valide_le as 'Validé le'
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
ORDER BY c.valide_le DESC;

-- ==========================================
-- 8. RECALCULER LES COMMISSIONS MANQUANTES
-- ==========================================
-- Ce script insère les commissions pour les coupons qui n'en ont pas

INSERT INTO commissions (
    partenaire_id,
    coupon_id,
    valeur_dh,
    montant_commission,
    taux_commission,
    created_at,
    mois
)
SELECT 
    p.id as partenaire_id,
    c.id as coupon_id,
    -- Calculer la base de commission
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        ELSE r.valeur_dh * r.discount_percentage / 100.0
    END as valeur_dh,
    -- Calculer la commission
    CASE 
        WHEN r.type = 'REDUCTION' 
        THEN r.valeur_dh * p.commission_rate / 100.0
        ELSE (r.valeur_dh * r.discount_percentage / 100.0) * p.commission_rate / 100.0
    END as montant_commission,
    p.commission_rate as taux_commission,
    c.valide_le as created_at,
    DATE_FORMAT(c.valide_le, '%Y-%m') as mois
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
  AND (
    (r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL)
    OR (r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL)
  )
  AND p.commission_rate > 0;

SELECT 
    '=== COMMISSIONS RECALCULÉES ===' as '';

SELECT COUNT(*) as 'Nouvelles commissions créées'
FROM commissions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE);

-- ==========================================
-- 9. RÉSUMÉ FINAL
-- ==========================================
SELECT 
    '=== RÉSUMÉ PAR PARTENAIRE ===' as '';

SELECT 
    p.name as 'Partenaire',
    COUNT(com.id) as 'Nb Commissions',
    SUM(com.valeur_dh) as 'Total CA (DH)',
    SUM(com.montant_commission) as 'Total Commission (DH)',
    AVG(com.taux_commission) as 'Taux Moyen %'
FROM partenaires p
LEFT JOIN commissions com ON com.partenaire_id = p.id
GROUP BY p.id, p.name
ORDER BY SUM(com.montant_commission) DESC;

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================
