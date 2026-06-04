-- Script de préparation des données pour tester le flux d'échange
-- Exécuter avec: mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026 < prepare-test-data.sql

-- ============================================
-- 1. VÉRIFIER ET PRÉPARER db_utilisateur
-- ============================================

USE db_utilisateur;

-- Vérifier le citoyen
SELECT '=== CITOYEN ===' AS '';
SELECT 
    auth_id, 
    total_points, 
    points_disponibles,
    created_at
FROM citizens 
WHERE auth_id = 1;

-- Si le citoyen n'a pas assez de points, les ajouter
UPDATE citizens 
SET total_points = 500, 
    points_disponibles = 500 
WHERE auth_id = 1 AND total_points < 200;

SELECT 'Points mis à jour si nécessaire' AS '';

-- ============================================
-- 2. VÉRIFIER ET PRÉPARER db_recompense
-- ============================================

USE db_recompense;

-- Vérifier les partenaires existants
SELECT '=== PARTENAIRES EXISTANTS ===' AS '';
SELECT 
    id, 
    user_id, 
    name, 
    category,
    commission_rate,
    vues_profil,
    clics_offres
FROM partenaire
ORDER BY id;

-- Créer un partenaire de test si user_id=3 n'existe pas
INSERT IGNORE INTO partenaire (
    user_id, name, category, address, city, 
    description, image_url, phone, website,
    commission_rate, vues_profil, clics_offres,
    opening_hours
) VALUES (
    3, 
    'EcoShop Test', 
    'COMMERCE_LOCAL', 
    '123 Boulevard Mohammed V', 
    'Casablanca',
    'Magasin partenaire de test pour validation des coupons. Offres variées pour tester le système de récompenses.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
    '0522123456',
    'https://ecoshop-test.ma',
    10.0,
    0,
    0,
    'Lun-Sam: 9h-19h'
);

SELECT 'Partenaire créé ou déjà existant' AS '';

-- Récupérer l'ID du partenaire
SET @partenaire_id = (SELECT id FROM partenaire WHERE user_id = 3 LIMIT 1);

-- Vérifier les récompenses existantes
SELECT '=== RÉCOMPENSES EXISTANTES ===' AS '';
SELECT 
    r.id,
    r.title,
    r.points_necessaires,
    r.type,
    r.stock,
    r.discount_percentage,
    r.valeur_dh,
    r.is_active,
    p.name as partenaire_name
FROM recompense r
JOIN partenaire p ON r.partenaire_id = p.id
WHERE p.user_id = 3
ORDER BY r.id;

-- Créer des récompenses de test si aucune n'existe
INSERT IGNORE INTO recompense (
    id, partenaire_id, title, description, image_url,
    points_necessaires, type, is_active,
    discount_percentage, valeur_dh, stock
) VALUES 
(
    1,
    @partenaire_id,
    'Réduction 20% sur tout le magasin',
    'Profitez de 20% de réduction sur l''ensemble de nos produits. Valable sur présentation du code coupon.',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da',
    100,
    'REDUCTION',
    true,
    20,
    50.0,
    NULL
),
(
    2,
    @partenaire_id,
    'Café gratuit',
    'Un café ou thé offert de votre choix.',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    50,
    'SERVICE',
    true,
    NULL,
    NULL,
    NULL
),
(
    3,
    @partenaire_id,
    'Tote bag écologique',
    'Sac réutilisable en coton bio. Stock limité!',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
    150,
    'STOCK',
    true,
    NULL,
    80.0,
    10
);

SELECT 'Récompenses créées ou déjà existantes' AS '';

-- Vérifier les coupons récents
SELECT '=== COUPONS RÉCENTS ===' AS '';
SELECT 
    c.id,
    c.code,
    c.user_id,
    c.status,
    c.points_utilises,
    c.created_at,
    c.valide_le,
    r.title as recompense_title
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
ORDER BY c.created_at DESC
LIMIT 10;

-- ============================================
-- 3. STATISTIQUES
-- ============================================

SELECT '=== STATISTIQUES ===' AS '';

SELECT 
    'Citoyen points' AS item,
    (SELECT total_points FROM db_utilisateur.citizens WHERE auth_id = 1) AS valeur
UNION ALL
SELECT 
    'Partenaires actifs',
    COUNT(*) 
FROM partenaire
UNION ALL
SELECT 
    'Récompenses actives',
    COUNT(*) 
FROM recompense 
WHERE is_active = true
UNION ALL
SELECT 
    'Coupons distribués',
    COUNT(*) 
FROM coupon
UNION ALL
SELECT 
    'Coupons utilisés',
    COUNT(*) 
FROM coupon 
WHERE status = 'UTILISE';

-- ============================================
-- 4. REQUÊTES UTILES POUR LE DÉBOGAGE
-- ============================================

-- Pour réinitialiser les points d'un citoyen:
-- UPDATE db_utilisateur.citizens SET total_points = 500, points_disponibles = 500 WHERE auth_id = 1;

-- Pour voir tous les coupons d'un utilisateur:
-- SELECT c.*, r.title FROM coupon c JOIN recompense r ON c.recompense_id = r.id WHERE c.user_id = 1;

-- Pour "réutiliser" un coupon (ATTENTION: pour test seulement):
-- UPDATE coupon SET status = 'DISTRIBUE', valide_le = NULL WHERE code = 'ECO-2026-XXXXX';

-- Pour voir les commissions:
-- SELECT * FROM commission ORDER BY created_at DESC LIMIT 10;

SELECT '=== DONNÉES PRÊTES POUR LE TEST ===' AS '';
