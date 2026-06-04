-- ============================================
-- Script de Test - Système d'Échange de Points
-- ============================================
-- Ce script permet de vérifier et configurer les données
-- pour tester l'échange de points contre des offres

-- ============================================
-- 1. VÉRIFICATION DE L'UTILISATEUR
-- ============================================

USE db_utilisateur;

-- Vérifier l'utilisateur ID 1
SELECT 
    id,
    auth_id,
    first_name,
    last_name,
    email,
    total_points,
    trust_score,
    city,
    created_at
FROM citizens 
WHERE auth_id = 1;

-- Si l'utilisateur n'a pas 400 points, les ajouter
UPDATE citizens 
SET total_points = 400 
WHERE auth_id = 1;

-- Vérifier la mise à jour
SELECT auth_id, first_name, last_name, email, total_points 
FROM citizens 
WHERE auth_id = 1;

-- ============================================
-- 2. VÉRIFICATION DES OFFRES DISPONIBLES
-- ============================================

USE db_recompense;

-- Lister toutes les offres actives
SELECT 
    r.id,
    r.title,
    r.description,
    r.points_necessaires,
    r.type,
    r.stock,
    r.discount_percentage,
    r.valeur_dh,
    r.is_active,
    p.name as partenaire_name,
    p.category as partenaire_category
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE r.is_active = true
ORDER BY r.points_necessaires ASC;

-- ============================================
-- 3. VÉRIFICATION DES PARTENAIRES
-- ============================================

-- Lister tous les partenaires
SELECT 
    id,
    user_id,
    name,
    category,
    city,
    commission_rate,
    vues_profil,
    clics_offres
FROM partenaires
ORDER BY name;

-- ============================================
-- 4. CRÉATION DE DONNÉES DE TEST (SI NÉCESSAIRE)
-- ============================================

-- Si aucune offre n'existe, en créer une pour tester

-- Vérifier si le partenaire existe (user_id = 2 par exemple)
SELECT * FROM partenaires WHERE user_id = 2;

-- Si pas d'offre de test, en créer une (décommenter si besoin)
/*
INSERT INTO recompenses (
    partenaire_id,
    title,
    description,
    points_necessaires,
    type,
    stock,
    discount_percentage,
    valeur_dh,
    is_active,
    created_at
) VALUES (
    (SELECT id FROM partenaires WHERE user_id = 2 LIMIT 1),
    'Café Gourmand - TEST',
    'Un délicieux café gourmand offert pour tester le système',
    150,
    'STOCK',
    10,
    NULL,
    50,
    true,
    NOW()
);
*/

-- ============================================
-- 5. HISTORIQUE DES COUPONS DE L'UTILISATEUR
-- ============================================

-- Voir tous les coupons de l'utilisateur ID 1
SELECT 
    c.id,
    c.code,
    c.user_id,
    c.points_utilises,
    c.status,
    c.expire_le,
    c.valide_le,
    c.created_at,
    r.title as recompense_title,
    p.name as partenaire_name
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
WHERE c.user_id = 1
ORDER BY c.created_at DESC;

-- ============================================
-- 6. VÉRIFIER LES COMMISSIONS
-- ============================================

-- Voir toutes les commissions
SELECT 
    co.id,
    co.valeur_dh,
    co.montant_commission,
    co.taux_commission,
    co.created_at,
    p.name as partenaire_name,
    cp.code as coupon_code
FROM commissions co
JOIN partenaires p ON co.partenaire_id = p.id
JOIN coupons cp ON co.coupon_id = cp.id
ORDER BY co.created_at DESC
LIMIT 20;

-- ============================================
-- 7. STATISTIQUES GLOBALES
-- ============================================

-- Points totaux distribués
SELECT SUM(total_points) as total_points_systeme
FROM db_utilisateur.citizens;

-- Nombre de coupons par statut
SELECT 
    status,
    COUNT(*) as nombre,
    SUM(points_utilises) as total_points
FROM coupons
GROUP BY status;

-- Top 5 des offres les plus échangées
SELECT 
    r.title,
    r.points_necessaires,
    COUNT(c.id) as nb_echanges,
    SUM(c.points_utilises) as total_points_utilises,
    p.name as partenaire_name
FROM recompenses r
LEFT JOIN coupons c ON r.id = c.recompense_id
JOIN partenaires p ON r.partenaire_id = p.id
GROUP BY r.id, r.title, r.points_necessaires, p.name
ORDER BY nb_echanges DESC
LIMIT 5;

-- ============================================
-- 8. REQUÊTES UTILES POUR LE DEBUGGING
-- ============================================

-- Trouver un coupon spécifique par son code
-- SELECT * FROM coupons WHERE code = 'ECO-2026-XXXXX';

-- Vérifier le stock d'une offre
-- SELECT id, title, stock FROM recompenses WHERE id = 1;

-- Réinitialiser le stock d'une offre
-- UPDATE recompenses SET stock = 10 WHERE id = 1;

-- Réinitialiser les points d'un utilisateur
-- UPDATE db_utilisateur.citizens SET total_points = 400 WHERE auth_id = 1;

-- Supprimer un coupon de test
-- DELETE FROM coupons WHERE id = 1;

-- ============================================
-- 9. SCÉNARIO DE TEST COMPLET
-- ============================================

-- AVANT L'ÉCHANGE
-- Vérifier les points de l'utilisateur
SELECT 'AVANT ÉCHANGE' as etape, auth_id, first_name, total_points 
FROM db_utilisateur.citizens 
WHERE auth_id = 1;

-- Vérifier une offre disponible
SELECT 'OFFRE DISPONIBLE' as etape, id, title, points_necessaires, stock, is_active 
FROM recompenses 
WHERE id = 1;

-- APRÈS L'ÉCHANGE (à exécuter après l'appel API)
-- Vérifier que les points ont été déduits
-- SELECT 'APRÈS ÉCHANGE' as etape, auth_id, first_name, total_points 
-- FROM db_utilisateur.citizens 
-- WHERE auth_id = 1;

-- Vérifier que le coupon a été créé
-- SELECT 'COUPON CRÉÉ' as etape, code, status, points_utilises 
-- FROM coupons 
-- WHERE user_id = 1 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- Vérifier que le stock a été décrémenté (si type STOCK)
-- SELECT 'STOCK MIS À JOUR' as etape, id, title, stock 
-- FROM recompenses 
-- WHERE id = 1;

-- ============================================
-- 10. NETTOYAGE (OPTIONNEL)
-- ============================================

-- Pour recommencer les tests à zéro (ATTENTION : supprime toutes les données)
/*
-- Supprimer tous les coupons de test
DELETE FROM commissions;
DELETE FROM coupons WHERE user_id = 1;

-- Réinitialiser les points
UPDATE db_utilisateur.citizens SET total_points = 400 WHERE auth_id = 1;

-- Réinitialiser le stock des offres
UPDATE recompenses SET stock = 10, is_active = true;

-- Réinitialiser les compteurs des partenaires
UPDATE partenaires SET vues_profil = 0, clics_offres = 0;
*/

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Résumé final
SELECT '=== ÉTAT ACTUEL DU SYSTÈME ===' as info;

SELECT 
    'Utilisateur' as type,
    auth_id as id,
    CONCAT(first_name, ' ', last_name) as nom,
    total_points as valeur
FROM db_utilisateur.citizens 
WHERE auth_id = 1

UNION ALL

SELECT 
    'Offres actives' as type,
    NULL as id,
    NULL as nom,
    COUNT(*) as valeur
FROM recompenses 
WHERE is_active = true

UNION ALL

SELECT 
    'Mes coupons' as type,
    NULL as id,
    status as nom,
    COUNT(*) as valeur
FROM coupons 
WHERE user_id = 1
GROUP BY status;
