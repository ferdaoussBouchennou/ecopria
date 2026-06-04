-- ============================================================
-- Script : Vérifier et corriger le calcul des commissions
-- ============================================================
-- Ce script fonctionne avec ecopria_recompense (nom JPA: Partenaire, Coupon, etc.)

USE ecopria_recompense;

-- ==========================================
-- 1. VÉRIFIER LES NOMS DES TABLES
-- ==========================================
SHOW TABLES;

-- ==========================================
-- 2. VÉRIFIER LA STRUCTURE DE LA TABLE PARTENAIRE
-- ==========================================
DESCRIBE partenaire;

-- ==========================================
-- 3. VÉRIFIER LES TAUX DE COMMISSION
-- ==========================================
SELECT 
    id,
    user_id,
    name,
    commission_rate AS taux_commission,
    CASE 
        WHEN commission_rate IS NULL OR commission_rate = 0 
        THEN '❌ PAS DE TAUX' 
        ELSE CONCAT('✅ ', commission_rate, '%')
    END AS status_taux
FROM partenaire
ORDER BY id;

-- ==========================================
-- 4. METTRE À JOUR LES TAUX MANQUANTS (SI NÉCESSAIRE)
-- ==========================================
-- Décommenter cette ligne si des partenaires n'ont pas de taux
-- UPDATE partenaire SET commission_rate = 15.0 WHERE commission_rate IS NULL OR commission_rate = 0;

-- ==========================================
-- 5. VÉRIFIER LA STRUCTURE DE LA TABLE COMMISSION
-- ==========================================
DESCRIBE commissions;

-- ==========================================
-- 6. VOIR TOUTES LES COMMISSIONS EXISTANTES
-- ==========================================
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS code_coupon,
    c.valeur_dh AS valeur_base_dh,
    c.taux_commission AS taux_pourcent,
    c.montant_commission AS commission_dh,
    c.mois_facturation AS mois,
    c.created_at
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.created_at DESC
LIMIT 20;

-- ==========================================
-- 7. VÉRIFIER LES CALCULS SONT CORRECTS
-- ==========================================
SELECT 
    p.name AS partenaire,
    co.code AS coupon,
    c.valeur_dh AS base,
    c.taux_commission AS taux,
    c.montant_commission AS commission_stockee,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) AS commission_attendue,
    CASE 
        WHEN ABS(c.montant_commission - (c.valeur_dh * c.taux_commission / 100)) < 0.01
        THEN '✅ OK'
        ELSE CONCAT('❌ ERREUR: écart de ', 
                    ROUND(c.montant_commission - (c.valeur_dh * c.taux_commission / 100), 2), 
                    ' DH')
    END AS validation
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.created_at DESC
LIMIT 20;

-- ==========================================
-- 8. VÉRIFIER LES COUPONS VALIDÉS
-- ==========================================
SELECT 
    co.id,
    co.code,
    co.status,
    r.title AS offre_titre,
    r.type AS type_offre,
    r.valeur_dh AS valeur_offre_dh,
    r.discount_percentage AS pourcentage_reduction,
    p.name AS partenaire,
    p.commission_rate AS taux_partenaire,
    co.valide_le,
    CASE 
        WHEN EXISTS (SELECT 1 FROM commissions WHERE coupon_id = co.id)
        THEN '✅ Commission créée'
        ELSE '❌ Pas de commission'
    END AS status_commission
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
ORDER BY co.valide_le DESC
LIMIT 20;

-- ==========================================
-- 9. TROUVER LES COUPONS SANS COMMISSION
-- ==========================================
SELECT 
    co.id AS coupon_id,
    co.code,
    r.title AS offre,
    r.type,
    r.valeur_dh,
    r.discount_percentage,
    p.name AS partenaire,
    p.commission_rate AS taux_partenaire,
    co.valide_le,
    -- Calcul de ce que devrait être la base
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
        ELSE 0
    END AS base_commission_attendue,
    -- Calcul de ce que devrait être la commission
    CASE 
        WHEN r.type = 'REDUCTION' 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        WHEN r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL 
            THEN ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
        ELSE 0
    END AS commission_attendue_dh
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

-- ==========================================
-- 10. CRÉER LES COMMISSIONS MANQUANTES
-- ==========================================
-- Cette requête crée automatiquement les commissions pour les coupons validés qui n'en ont pas

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
    -- Calcul de la base de commission
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        ELSE ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
    END AS valeur_dh,
    -- Calcul du montant de la commission
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

-- ==========================================
-- 11. VÉRIFIER LES NOUVELLES COMMISSIONS CRÉÉES
-- ==========================================
SELECT 
    'Nombre de commissions créées:' AS info,
    COUNT(*) AS nombre
FROM commissions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE);

-- ==========================================
-- 12. RÉSUMÉ PAR MOIS ET PAR PARTENAIRE
-- ==========================================
SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS nombre_coupons,
    SUM(c.valeur_dh) AS ca_genere_dh,
    AVG(c.taux_commission) AS taux_moyen_pourcent,
    SUM(c.montant_commission) AS commission_totale_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.id, p.name, c.mois_facturation
ORDER BY c.mois_facturation DESC, commission_totale_dh DESC;

-- ==========================================
-- 13. RÉSUMÉ GLOBAL
-- ==========================================
SELECT 
    COUNT(DISTINCT p.id) AS nombre_partenaires,
    COUNT(c.id) AS total_commissions,
    SUM(c.valeur_dh) AS ca_total_genere_dh,
    SUM(c.montant_commission) AS commission_totale_dh,
    AVG(c.taux_commission) AS taux_moyen_pourcent
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id;

-- ==========================================
-- 14. COMMISSIONS DU MOIS EN COURS (POUR LE FRONTEND)
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
-- FIN DU SCRIPT
-- ==========================================
-- Commandes utiles :
-- Pour réinitialiser toutes les commissions : DELETE FROM commissions;
-- Pour mettre à jour le taux d'un partenaire : UPDATE partenaire SET commission_rate = 15.0 WHERE id = 1;
