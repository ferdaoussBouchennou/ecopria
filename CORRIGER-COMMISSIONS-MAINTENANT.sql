-- ============================================================
-- Script : Corriger TOUTES les commissions existantes
-- ============================================================
-- Ce script recalcule correctement toutes les commissions
-- en utilisant la formule : commission = valeur_dh × taux_commission / 100

USE ecopria_recompense;

-- ==========================================
-- 1. DIAGNOSTIC : Voir les commissions INCORRECTES
-- ==========================================
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS valeur_base,
    c.taux_commission AS taux,
    c.montant_commission AS commission_actuelle,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) AS commission_correcte,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) - c.montant_commission AS ecart,
    CASE 
        WHEN ABS(c.montant_commission - (c.valeur_dh * c.taux_commission / 100)) > 0.01
        THEN '❌ INCORRECT'
        ELSE '✅ OK'
    END AS status
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.id;

-- ==========================================
-- 2. CORRECTION : Recalculer toutes les commissions
-- ==========================================
UPDATE commissions
SET montant_commission = ROUND(valeur_dh * taux_commission / 100, 2)
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) > 0.01;

-- ==========================================
-- 3. VÉRIFICATION : Afficher les commissions corrigées
-- ==========================================
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS valeur_base,
    c.taux_commission AS taux,
    c.montant_commission AS commission_corrigee,
    CASE 
        WHEN ABS(c.montant_commission - (c.valeur_dh * c.taux_commission / 100)) < 0.01
        THEN '✅ OK'
        ELSE '❌ ENCORE INCORRECT'
    END AS status
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.id;

-- ==========================================
-- 4. RÉSUMÉ PAR MOIS (ce que le frontend affiche)
-- ==========================================
SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS nombre_coupons,
    SUM(c.valeur_dh) AS ca_genere_dh,
    SUM(c.montant_commission) AS commission_totale_dh,
    AVG(c.taux_commission) AS taux_moyen
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.id, p.name, c.mois_facturation
ORDER BY c.mois_facturation DESC, commission_totale_dh DESC;

-- ==========================================
-- 5. COMMISSION DU MOIS EN COURS (pour le frontend)
-- ==========================================
SELECT 
    p.name AS partenaire,
    DATE_FORMAT(NOW(), '%Y-%m') AS mois_actuel,
    COUNT(c.id) AS coupons_utilises,
    SUM(c.valeur_dh) AS ca_genere_dh,
    SUM(c.montant_commission) AS commission_a_payer_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
WHERE c.mois_facturation = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY p.id, p.name
ORDER BY commission_a_payer_dh DESC;

-- ==========================================
-- 6. DÉTAIL DES CALCULS (pour vérification)
-- ==========================================
SELECT 
    c.id,
    p.name AS partenaire,
    c.valeur_dh AS base,
    c.taux_commission AS taux,
    c.montant_commission AS commission,
    CONCAT(c.valeur_dh, ' × ', c.taux_commission, ' / 100 = ', 
           ROUND(c.valeur_dh * c.taux_commission / 100, 2)) AS formule
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
ORDER BY c.id;

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================
