-- ============================================================
-- Script : Créer les commissions manquantes pour les coupons validés
-- ============================================================

USE ecopria_recompense;

-- Voir les coupons validés SANS commission
SELECT 
    '=== COUPONS VALIDÉS SANS COMMISSION ===' AS '';

SELECT 
    co.id AS coupon_id,
    co.code,
    co.status,
    co.valide_le,
    r.id AS recompense_id,
    r.title AS offre,
    r.type AS type_offre,
    r.valeur_dh,
    r.discount_percentage,
    p.id AS partenaire_id,
    p.name AS partenaire,
    p.commission_rate AS taux_partenaire,
    -- Calcul de la base de commission
    CASE 
        WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL 
            THEN r.valeur_dh
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
        WHEN r.valeur_dh IS NOT NULL 
            THEN r.valeur_dh
        ELSE 0
    END AS base_commission,
    -- Calcul de la commission
    CASE 
        WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
        WHEN r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        ELSE 0
    END AS commission_a_creer
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions)
ORDER BY co.valide_le DESC;

-- Créer les commissions manquantes
INSERT INTO commissions (
    partenaire_id,
    coupon_id,
    valeur_dh,
    montant_commission,
    taux_commission,
    mois_facturation,
    created_at
)
SELECT 
    p.id AS partenaire_id,
    co.id AS coupon_id,
    -- Base de commission
    CASE 
        WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL 
            THEN r.valeur_dh
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
        WHEN r.valeur_dh IS NOT NULL 
            THEN r.valeur_dh
        ELSE 0
    END AS valeur_dh,
    -- Montant de la commission
    CASE 
        WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
        WHEN r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        ELSE 0
    END AS montant_commission,
    p.commission_rate AS taux_commission,
    DATE_FORMAT(COALESCE(co.valide_le, co.created_at), '%Y-%m') AS mois_facturation,
    COALESCE(co.valide_le, co.created_at) AS created_at
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions)
  AND (
      r.valeur_dh IS NOT NULL AND r.valeur_dh > 0
  )
  AND p.commission_rate > 0;

-- Vérifier le résultat
SELECT 
    '=== NOUVELLES COMMISSIONS CRÉÉES ===' AS '';

SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS base,
    c.taux_commission AS taux,
    c.montant_commission AS commission,
    c.mois_facturation,
    c.created_at
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY c.created_at DESC;

-- Résumé du mois en cours
SELECT 
    '=== RÉSUMÉ MOIS EN COURS (JUIN 2026) ===' AS '';

SELECT 
    p.name AS partenaire,
    COUNT(c.id) AS coupons_valides,
    SUM(c.valeur_dh) AS ca_genere_dh,
    SUM(c.montant_commission) AS commission_totale_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
WHERE c.mois_facturation = '2026-06'
GROUP BY p.name;

-- FIN
