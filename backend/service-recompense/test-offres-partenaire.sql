-- =====================================================
-- Script de test : Vérifier les offres par partenaire
-- =====================================================

USE db_recompense;

-- Lister tous les partenaires avec leur nombre d'offres
SELECT 
    p.user_id,
    p.name as partenaire,
    p.category,
    COUNT(r.id) as nb_offres_actives
FROM partenaires p
LEFT JOIN recompenses r ON r.partenaire_id = p.id AND r.is_active = 1
WHERE p.user_id >= 101 AND p.user_id <= 107
GROUP BY p.id, p.user_id, p.name, p.category
ORDER BY p.name;

-- Détail des offres du Café Botanique (user_id = 101)
SELECT 
    'Café Botanique (user_id=101)' as info;
    
SELECT 
    r.id,
    r.title,
    r.type,
    r.points_necessaires,
    r.is_active,
    CASE 
        WHEN r.stock IS NULL THEN 'Illimité'
        ELSE CAST(r.stock AS CHAR)
    END as stock
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE p.user_id = 101 AND r.is_active = 1;

-- Détail des offres de Zara Maroc (user_id = 102)
SELECT 
    'Zara Maroc (user_id=102)' as info;
    
SELECT 
    r.id,
    r.title,
    r.type,
    r.points_necessaires,
    r.is_active,
    CASE 
        WHEN r.stock IS NULL THEN 'Illimité'
        ELSE CAST(r.stock AS CHAR)
    END as stock
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE p.user_id = 102 AND r.is_active = 1;

-- Détail des offres de Le Jardin Secret (user_id = 103)
SELECT 
    'Le Jardin Secret (user_id=103)' as info;
    
SELECT 
    r.id,
    r.title,
    r.type,
    r.points_necessaires,
    r.is_active,
    CASE 
        WHEN r.stock IS NULL THEN 'Illimité'
        ELSE CAST(r.stock AS CHAR)
    END as stock
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE p.user_id = 103 AND r.is_active = 1;

-- Vérifier qu'il n'y a pas d'offres "orphelines" sans partenaire valide
SELECT 
    'Offres sans partenaire valide' as probleme,
    r.id,
    r.title,
    r.partenaire_id
FROM recompenses r
LEFT JOIN partenaires p ON r.partenaire_id = p.id
WHERE p.id IS NULL;
