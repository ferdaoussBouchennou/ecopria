-- ============================================================
-- Script : Vérifier les commissions du mois en cours
-- ============================================================
-- Ce script vérifie les données de commission pour le mois actuel
-- pour tous les partenaires dans la base de données ecopria_recompense

USE ecopria_recompense;

-- 1. Afficher le mois actuel
SELECT 
    DATE_FORMAT(NOW(), '%Y-%m') AS mois_actuel,
    DATE_FORMAT(NOW(), '%M %Y') AS mois_actuel_format;

-- 2. Vérifier les commissions du mois en cours pour tous les partenaires
SELECT 
    p.id AS partenaire_id,
    p.name AS partenaire_name,
    cm.mois,
    cm.coupons_utilises,
    cm.ca_genere_dh AS ca_genere,
    cm.commission_dh AS commission,
    cm.created_at
FROM commission_mensuelle cm
JOIN partenaire p ON cm.partenaire_id = p.id
WHERE cm.mois = DATE_FORMAT(NOW(), '%Y-%m')
ORDER BY cm.commission_dh DESC;

-- 3. Vérifier tous les coupons validés ce mois pour chaque partenaire
SELECT 
    p.id AS partenaire_id,
    p.name AS partenaire_name,
    COUNT(c.id) AS coupons_valides_ce_mois,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                r.valeur_dh
            ELSE 0
        END
    ) AS ca_genere_calcule,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0 * p.commission_taux / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                (r.valeur_dh * p.commission_taux / 100.0)
            ELSE 0
        END
    ) AS commission_calculee
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE c.status = 'UTILISE'
  AND DATE_FORMAT(c.valide_le, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY p.id, p.name
ORDER BY commission_calculee DESC;

-- 4. Comparaison entre les données stockées et calculées
SELECT 
    'Stocké dans commission_mensuelle' AS source,
    p.name AS partenaire,
    cm.mois,
    cm.coupons_utilises,
    cm.ca_genere_dh AS ca_genere,
    cm.commission_dh AS commission
FROM commission_mensuelle cm
JOIN partenaire p ON cm.partenaire_id = p.id
WHERE cm.mois = DATE_FORMAT(NOW(), '%Y-%m')

UNION ALL

SELECT 
    'Calculé depuis coupons' AS source,
    p.name AS partenaire,
    DATE_FORMAT(NOW(), '%Y-%m') AS mois,
    COUNT(c.id) AS coupons_utilises,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                r.valeur_dh
            ELSE 0
        END
    ) AS ca_genere,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0 * p.commission_taux / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                (r.valeur_dh * p.commission_taux / 100.0)
            ELSE 0
        END
    ) AS commission
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE c.status = 'UTILISE'
  AND DATE_FORMAT(c.valide_le, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY p.id, p.name
ORDER BY partenaire, source;

-- 5. Résumé global pour tous les partenaires ce mois
SELECT 
    COUNT(DISTINCT p.id) AS nombre_partenaires_avec_commissions,
    COUNT(c.id) AS total_coupons_valides,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                r.valeur_dh
            ELSE 0
        END
    ) AS ca_total_genere,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0 * p.commission_taux / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                (r.valeur_dh * p.commission_taux / 100.0)
            ELSE 0
        END
    ) AS commission_totale_a_payer
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE c.status = 'UTILISE'
  AND DATE_FORMAT(c.valide_le, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m');

-- 6. Vérifier si la table commission_mensuelle est à jour
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM commission_mensuelle 
            WHERE mois = DATE_FORMAT(NOW(), '%Y-%m')
        ) THEN 'OUI - La table commission_mensuelle contient des données pour ce mois'
        ELSE 'NON - Aucune donnée dans commission_mensuelle pour ce mois'
    END AS table_a_jour;

-- 7. Afficher les taux de commission des partenaires
SELECT 
    p.id,
    p.name,
    p.commission_taux AS taux_commission_pourcent,
    CONCAT(p.commission_taux, '%') AS taux_affiche
FROM partenaire p
ORDER BY p.commission_taux DESC;

