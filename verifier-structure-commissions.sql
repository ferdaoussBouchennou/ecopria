-- ============================================================
-- Script : Vérifier la structure et les données de commissions
-- ============================================================

USE ecopria_recompense;

-- 1. Structure de la table partenaire (vérifier commission_rate)
DESCRIBE partenaire;

-- 2. Voir les taux de commission des partenaires
SELECT 
    id,
    name,
    commission_rate AS taux_commission_pourcent
FROM partenaire
ORDER BY id;

-- 3. Structure de la table commissions
DESCRIBE commissions;

-- 4. Voir toutes les commissions enregistrées
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS code_coupon,
    c.valeur_dh AS valeur_base,
    c.taux_commission AS taux_applique,
    c.montant_commission AS commission_calculee,
    c.mois_facturation,
    c.created_at
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.created_at DESC;

-- 5. Vérifier les calculs de commission
SELECT 
    p.name AS partenaire,
    c.valeur_dh AS valeur_base,
    c.taux_commission AS taux_pourcent,
    c.montant_commission AS commission_stockee,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) AS commission_calculee,
    CASE 
        WHEN ROUND(c.valeur_dh * c.taux_commission / 100, 2) = ROUND(c.montant_commission, 2)
        THEN '✅ OK'
        ELSE '❌ ERREUR'
    END AS validation
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
ORDER BY c.created_at DESC;

-- 6. Résumé mensuel (ce que le frontend affiche)
SELECT 
    c.mois_facturation AS mois,
    COUNT(c.id) AS nombre_coupons,
    SUM(c.valeur_dh) AS ca_genere_total,
    SUM(c.montant_commission) AS commission_totale
FROM commissions c
GROUP BY c.mois_facturation
ORDER BY c.mois_facturation DESC;

-- 7. Voir les coupons validés qui n'ont PAS de commission
SELECT 
    co.code,
    r.title AS offre,
    r.type AS type_offre,
    r.discount_percentage AS pourcentage_reduction,
    r.valeur_dh AS valeur_dh,
    co.status,
    co.valide_le
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions)
ORDER BY co.valide_le DESC;

-- 8. Détail d'une offre pour comprendre le calcul
SELECT 
    r.id AS offre_id,
    r.title AS offre_titre,
    r.type AS type_offre,
    r.discount_percentage AS pourcent_reduction,
    r.valeur_dh AS valeur_dh,
    p.name AS partenaire,
    p.commission_rate AS taux_commission_partenaire,
    CASE 
        WHEN r.type = 'REDUCTION' THEN 
            CONCAT(r.valeur_dh, ' DH de base')
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL THEN
            CONCAT(r.valeur_dh, ' × ', r.discount_percentage, '% = ', 
                   ROUND(r.valeur_dh * r.discount_percentage / 100, 2), ' DH')
        ELSE 'Pas de base commission'
    END AS calcul_base,
    CASE 
        WHEN r.type = 'REDUCTION' THEN 
            ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL THEN
            ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
        ELSE 0
    END AS commission_attendue
FROM recompense r
JOIN partenaire p ON r.partenaire_id = p.id
WHERE r.is_active = TRUE
ORDER BY r.id DESC;
