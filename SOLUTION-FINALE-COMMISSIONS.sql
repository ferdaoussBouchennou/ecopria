-- ============================================================
-- SOLUTION FINALE : Corriger et Vérifier les Commissions
-- ============================================================
-- Ce script corrige les commissions existantes ET vérifie
-- que le système calcule correctement pour les nouveaux coupons

USE ecopria_recompense;

-- ==========================================
-- PARTIE 1 : DIAGNOSTIC COMPLET
-- ==========================================

-- 1.1 Voir TOUTES les commissions avec leur calcul
SELECT 
    '=== TOUTES LES COMMISSIONS ===' AS '';

SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS valeur_base,
    c.taux_commission AS taux,
    c.montant_commission AS commission_stockee,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) AS commission_correcte,
    c.mois_facturation AS mois,
    CASE 
        WHEN ABS(c.montant_commission - (c.valeur_dh * c.taux_commission / 100)) < 0.01
        THEN '✅ OK'
        ELSE '❌ INCORRECT'
    END AS status,
    c.created_at
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.created_at DESC;

-- 1.2 Statistiques par statut
SELECT 
    '=== STATISTIQUES ===' AS '';

SELECT 
    CASE 
        WHEN ABS(montant_commission - (valeur_dh * taux_commission / 100)) < 0.01
        THEN 'Correctes'
        ELSE 'Incorrectes'
    END AS type,
    COUNT(*) AS nombre,
    SUM(montant_commission) AS total_commission_stockee,
    SUM(ROUND(valeur_dh * taux_commission / 100, 2)) AS total_commission_correcte
FROM commissions
GROUP BY CASE 
    WHEN ABS(montant_commission - (valeur_dh * taux_commission / 100)) < 0.01
    THEN 'Correctes'
    ELSE 'Incorrectes'
END;

-- ==========================================
-- PARTIE 2 : CORRECTION DES COMMISSIONS EXISTANTES
-- ==========================================

SELECT 
    '=== CORRECTION EN COURS ===' AS '';

-- 2.1 Sauvegarder les anciennes valeurs (optionnel)
-- CREATE TABLE commissions_backup_20260604 AS SELECT * FROM commissions;

-- 2.2 Corriger TOUTES les commissions incorrectes
UPDATE commissions
SET montant_commission = ROUND(valeur_dh * taux_commission / 100, 2)
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) > 0.01;

SELECT 
    '=== CORRECTION TERMINÉE ===' AS '';

-- 2.3 Vérifier que tout est corrigé
SELECT 
    COUNT(*) AS nb_commissions_correctes
FROM commissions
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) < 0.01;

SELECT 
    COUNT(*) AS nb_commissions_incorrectes
FROM commissions
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) > 0.01;

-- ==========================================
-- PARTIE 3 : CRÉER LES COMMISSIONS MANQUANTES
-- ==========================================

SELECT 
    '=== COUPONS SANS COMMISSION ===' AS '';

-- 3.1 Lister les coupons validés sans commission
SELECT 
    co.id AS coupon_id,
    co.code,
    r.title AS offre,
    r.type,
    r.valeur_dh,
    r.discount_percentage,
    p.name AS partenaire,
    p.commission_rate AS taux,
    co.valide_le,
    CASE 
        WHEN r.type = 'REDUCTION' 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
        ELSE 0
    END AS commission_a_creer
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions)
  AND (
      (r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL)
      OR (r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL)
  )
ORDER BY co.valide_le DESC;

-- 3.2 Créer les commissions manquantes
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
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        ELSE ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
    END AS valeur_dh,
    CASE 
        WHEN r.type = 'REDUCTION' 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        ELSE ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
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
      (r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL)
      OR (r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL)
  )
  AND p.commission_rate > 0;

SELECT 
    CONCAT('✅ ', ROW_COUNT(), ' nouvelle(s) commission(s) créée(s)') AS resultat;

-- ==========================================
-- PARTIE 4 : RÉSUMÉ MENSUEL (CE QUE LE FRONTEND AFFICHE)
-- ==========================================

SELECT 
    '=== RÉSUMÉ MENSUEL PAR PARTENAIRE ===' AS '';

SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS nombre_coupons_valides,
    SUM(c.valeur_dh) AS ca_genere_dh,
    AVG(c.taux_commission) AS taux_moyen_pourcent,
    SUM(c.montant_commission) AS commission_totale_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.id, p.name, c.mois_facturation
ORDER BY c.mois_facturation DESC, commission_totale_dh DESC;

-- ==========================================
-- PARTIE 5 : MOIS EN COURS (POUR LE FRONTEND)
-- ==========================================

SELECT 
    '=== COMMISSION DU MOIS EN COURS ===' AS '';

SELECT 
    p.name AS partenaire,
    DATE_FORMAT(NOW(), '%Y-%m') AS mois_actuel,
    COUNT(c.id) AS coupons_utilises,
    SUM(c.valeur_dh) AS ca_genere_dh,
    AVG(c.taux_commission) AS taux_moyen,
    SUM(c.montant_commission) AS commission_a_payer_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
WHERE c.mois_facturation = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY p.id, p.name
ORDER BY commission_a_payer_dh DESC;

-- ==========================================
-- PARTIE 6 : DÉTAIL DES COMMISSIONS (POUR VÉRIFICATION)
-- ==========================================

SELECT 
    '=== DÉTAIL DE CHAQUE COMMISSION ===' AS '';

SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS coupon,
    r.title AS offre,
    c.valeur_dh AS base,
    c.taux_commission AS taux,
    c.montant_commission AS commission,
    CONCAT(c.valeur_dh, ' × ', c.taux_commission, '% / 100 = ', c.montant_commission, ' DH') AS formule,
    c.mois_facturation AS mois,
    DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS date
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
JOIN recompense r ON co.recompense_id = r.id
ORDER BY c.created_at DESC
LIMIT 20;

-- ==========================================
-- PARTIE 7 : VALIDATION FINALE
-- ==========================================

SELECT 
    '=== VALIDATION FINALE ===' AS '';

SELECT 
    'Toutes les commissions' AS type,
    COUNT(*) AS nombre,
    SUM(montant_commission) AS total_commission_dh
FROM commissions

UNION ALL

SELECT 
    'Commissions correctes' AS type,
    COUNT(*) AS nombre,
    SUM(montant_commission) AS total_commission_dh
FROM commissions
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) < 0.01

UNION ALL

SELECT 
    'Commissions incorrectes' AS type,
    COUNT(*) AS nombre,
    SUM(montant_commission) AS total_commission_dh
FROM commissions
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) > 0.01;

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================

SELECT 
    '=== ✅ SCRIPT TERMINÉ ===' AS '';

SELECT 
    'Le système est maintenant prêt.' AS message,
    'Rechargez le frontend : http://localhost:4200/partenaire/commissions' AS action;
