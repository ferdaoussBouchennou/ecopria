-- ================================================================
-- SCRIPT FINAL : Corriger les Commissions et Vérifier le Système
-- ================================================================
-- Ce script corrige les données ET vérifie que le code fonctionne

USE ecopria_recompense;

-- ================================================================
-- ÉTAPE 1 : DIAGNOSTIC - Voir l'état actuel
-- ================================================================

SELECT '========================================' AS '';
SELECT '    DIAGNOSTIC AVANT CORRECTION        ' AS '';
SELECT '========================================' AS '';

-- Voir toutes les commissions actuelles
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS base_dh,
    c.taux_commission AS taux_pourcent,
    c.montant_commission AS commission_actuelle_dh,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) AS commission_correcte_dh,
    c.mois_facturation,
    CASE 
        WHEN ABS(c.montant_commission - (c.valeur_dh * c.taux_commission / 100)) < 0.01
        THEN '✅ CORRECT'
        ELSE CONCAT('❌ ERREUR: devrait être ', ROUND(c.valeur_dh * c.taux_commission / 100, 2), ' DH')
    END AS validation
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.id;

-- Résumé par mois AVANT correction
SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS coupons,
    SUM(c.montant_commission) AS commission_totale_actuelle_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.name, c.mois_facturation
ORDER BY c.mois_facturation DESC;

-- ================================================================
-- ÉTAPE 2 : CORRECTION - Recalculer toutes les commissions
-- ================================================================

SELECT '========================================' AS '';
SELECT '      CORRECTION EN COURS...           ' AS '';
SELECT '========================================' AS '';

-- Mettre à jour TOUTES les commissions avec le calcul correct
UPDATE commissions
SET montant_commission = ROUND(valeur_dh * taux_commission / 100, 2);

SELECT 'Toutes les commissions ont été recalculées !' AS resultat;

-- ================================================================
-- ÉTAPE 3 : VÉRIFICATION - Voir le résultat
-- ================================================================

SELECT '========================================' AS '';
SELECT '     RÉSULTAT APRÈS CORRECTION         ' AS '';
SELECT '========================================' AS '';

-- Voir toutes les commissions APRÈS correction
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS base_dh,
    c.taux_commission AS taux_pourcent,
    c.montant_commission AS commission_dh,
    CONCAT(c.valeur_dh, ' × ', c.taux_commission, '% = ', c.montant_commission, ' DH') AS formule,
    c.mois_facturation
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.id;

-- ================================================================
-- ÉTAPE 4 : RÉSUMÉ MENSUEL (CE QUE LE FRONTEND AFFICHE)
-- ================================================================

SELECT '========================================' AS '';
SELECT '    RÉSUMÉ MENSUEL (POUR FRONTEND)     ' AS '';
SELECT '========================================' AS '';

SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS coupons_utilises,
    SUM(c.valeur_dh) AS ca_genere_dh,
    AVG(c.taux_commission) AS taux_moyen_pourcent,
    SUM(c.montant_commission) AS commission_totale_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.name, c.mois_facturation
ORDER BY c.mois_facturation DESC;

-- ================================================================
-- ÉTAPE 5 : MOIS EN COURS (POUR LA CARTE EN ÉVIDENCE)
-- ================================================================

SELECT '========================================' AS '';
SELECT '   COMMISSION DU MOIS EN COURS         ' AS '';
SELECT '========================================' AS '';

SELECT 
    p.name AS partenaire,
    '2026-06' AS mois_actuel,
    COUNT(c.id) AS coupons_utilises,
    SUM(c.valeur_dh) AS ca_genere_dh,
    SUM(c.montant_commission) AS commission_a_payer_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
WHERE c.mois_facturation = '2026-06'
GROUP BY p.name;

-- ================================================================
-- ÉTAPE 6 : CRÉER LES COMMISSIONS MANQUANTES (si besoin)
-- ================================================================

SELECT '========================================' AS '';
SELECT '  CRÉATION COMMISSIONS MANQUANTES      ' AS '';
SELECT '========================================' AS '';

-- Voir les coupons validés SANS commission
SELECT 
    co.id AS coupon_id,
    co.code,
    r.title AS offre,
    p.name AS partenaire,
    p.commission_rate AS taux,
    'Commission manquante !' AS status
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions);

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
    p.id,
    co.id,
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
        ELSE 0
    END AS valeur_dh,
    CASE 
        WHEN r.type = 'REDUCTION' 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
        ELSE 0
    END AS montant_commission,
    p.commission_rate,
    DATE_FORMAT(COALESCE(co.valide_le, co.created_at), '%Y-%m'),
    COALESCE(co.valide_le, co.created_at)
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions)
  AND (
      (r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL)
      OR (r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL)
  )
  AND p.commission_rate > 0;

-- ================================================================
-- ÉTAPE 7 : RÉSUMÉ FINAL
-- ================================================================

SELECT '========================================' AS '';
SELECT '          RÉSUMÉ FINAL                  ' AS '';
SELECT '========================================' AS '';

SELECT 
    COUNT(*) AS total_commissions,
    SUM(montant_commission) AS total_commission_dh,
    MIN(montant_commission) AS min_commission_dh,
    MAX(montant_commission) AS max_commission_dh,
    AVG(montant_commission) AS moyenne_commission_dh
FROM commissions;

SELECT 
    '✅ TERMINÉ !' AS status,
    'Rechargez le frontend avec F5' AS action,
    'http://localhost:4200/partenaire/commissions' AS url;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
