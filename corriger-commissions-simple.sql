-- ==========================================
-- CORRECTION SIMPLE DES COMMISSIONS
-- ==========================================
-- À exécuter dans phpMyAdmin (db_recompense)

USE db_recompense;

-- ==========================================
-- 1. VÉRIFIER LES PARTENAIRES
-- ==========================================
SELECT 
    id,
    name,
    commission_rate as 'Taux Commission %'
FROM partenaires;

-- ==========================================
-- 2. DÉFINIR TAUX 10% POUR TOUS
-- ==========================================
UPDATE partenaires 
SET commission_rate = 10.0 
WHERE commission_rate IS NULL OR commission_rate = 0;

-- Vérifier
SELECT 'PARTENAIRES MIS À JOUR' as '';
SELECT id, name, commission_rate FROM partenaires;

-- ==========================================
-- 3. VÉRIFIER LES RÉCOMPENSES
-- ==========================================
SELECT 
    id,
    title,
    type,
    points_necessaires,
    discount_percentage,
    valeur_dh
FROM recompenses
WHERE is_active = 1;

-- ==========================================
-- 4. CORRIGER LES RÉCOMPENSES
-- ==========================================
-- Pour les offres STOCK sans valeur
UPDATE recompenses 
SET 
    valeur_dh = points_necessaires * 0.1,
    discount_percentage = 100
WHERE type = 'STOCK' 
  AND valeur_dh IS NULL
  AND is_active = 1;

-- Pour les offres REDUCTION sans valeur
UPDATE recompenses 
SET valeur_dh = points_necessaires * 0.05
WHERE type = 'REDUCTION' 
  AND valeur_dh IS NULL
  AND is_active = 1;

-- Pour les offres SERVICE sans valeur
UPDATE recompenses 
SET 
    valeur_dh = points_necessaires * 0.1,
    discount_percentage = 100
WHERE type = 'SERVICE' 
  AND valeur_dh IS NULL
  AND is_active = 1;

-- Pour les offres EXPERIENCE sans valeur
UPDATE recompenses 
SET 
    valeur_dh = points_necessaires * 0.1,
    discount_percentage = 100
WHERE type = 'EXPERIENCE' 
  AND valeur_dh IS NULL
  AND is_active = 1;

-- Vérifier
SELECT 'RÉCOMPENSES MISES À JOUR' as '';
SELECT id, title, type, discount_percentage, valeur_dh FROM recompenses WHERE is_active = 1;

-- ==========================================
-- 5. COUPONS VALIDÉS SANS COMMISSION
-- ==========================================
SELECT 'COUPONS SANS COMMISSION' as '';

SELECT 
    c.id,
    c.code,
    r.title,
    r.type,
    r.valeur_dh,
    r.discount_percentage,
    p.name,
    p.commission_rate,
    c.valide_le
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
ORDER BY c.valide_le DESC;

-- ==========================================
-- 6. RECALCULER LES COMMISSIONS (TYPE REDUCTION)
-- ==========================================
-- NOTE: Si vous avez une erreur "Unknown column 'mois'",
-- remplacez 'mois' par 'mois_facturation' dans ce script

INSERT INTO commissions (
    partenaire_id,
    coupon_id,
    valeur_dh,
    montant_commission,
    taux_commission,
    created_at,
    mois_facturation
)
SELECT 
    p.id,
    c.id,
    r.valeur_dh,
    r.valeur_dh * p.commission_rate / 100.0,
    p.commission_rate,
    c.valide_le,
    DATE_FORMAT(c.valide_le, '%Y-%m')
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
  AND r.type = 'REDUCTION'
  AND r.valeur_dh IS NOT NULL
  AND p.commission_rate > 0;

-- ==========================================
-- 7. RECALCULER LES COMMISSIONS (AUTRES TYPES)
-- ==========================================
INSERT INTO commissions (
    partenaire_id,
    coupon_id,
    valeur_dh,
    montant_commission,
    taux_commission,
    created_at,
    mois_facturation
)
SELECT 
    p.id,
    c.id,
    r.valeur_dh * r.discount_percentage / 100.0,
    (r.valeur_dh * r.discount_percentage / 100.0) * p.commission_rate / 100.0,
    p.commission_rate,
    c.valide_le,
    DATE_FORMAT(c.valide_le, '%Y-%m')
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
  AND r.type != 'REDUCTION'
  AND r.discount_percentage IS NOT NULL
  AND r.valeur_dh IS NOT NULL
  AND p.commission_rate > 0;

-- ==========================================
-- 8. VÉRIFIER LES COMMISSIONS CRÉÉES
-- ==========================================
SELECT 'COMMISSIONS CRÉÉES' as '';

SELECT 
    com.id,
    p.name as 'Partenaire',
    c.code as 'Coupon',
    r.title as 'Récompense',
    com.valeur_dh as 'Base DH',
    com.taux_commission as 'Taux %',
    com.montant_commission as 'Commission DH',
    com.created_at as 'Date'
FROM commissions com
JOIN partenaires p ON com.partenaire_id = p.id
JOIN coupons c ON com.coupon_id = c.id
JOIN recompenses r ON c.recompense_id = r.id
ORDER BY com.created_at DESC
LIMIT 20;

-- ==========================================
-- 9. RÉSUMÉ PAR PARTENAIRE
-- ==========================================
SELECT 'RÉSUMÉ PAR PARTENAIRE' as '';

SELECT 
    p.name as 'Partenaire',
    COUNT(com.id) as 'Nb Commissions',
    ROUND(SUM(com.valeur_dh), 2) as 'CA Total (DH)',
    ROUND(SUM(com.montant_commission), 2) as 'Commission Totale (DH)',
    ROUND(AVG(com.taux_commission), 2) as 'Taux Moyen %'
FROM partenaires p
LEFT JOIN commissions com ON com.partenaire_id = p.id
GROUP BY p.id, p.name
ORDER BY SUM(com.montant_commission) DESC;

-- ==========================================
-- FIN - TOUT EST CORRIGÉ!
-- ==========================================
