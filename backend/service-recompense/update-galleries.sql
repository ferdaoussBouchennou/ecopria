-- =====================================================
-- Ajout de galeries photos pour les partenaires
-- Images de haute qualité depuis Unsplash
-- =====================================================

USE db_recompense;

-- ─────────────────────────────────────────────────────
-- CAFÉ BOTANIQUE
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop'
)
WHERE user_id = 101;

-- ─────────────────────────────────────────────────────
-- ZARA MAROC
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop'
)
WHERE user_id = 102;

-- ─────────────────────────────────────────────────────
-- LE JARDIN SECRET
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&h=400&fit=crop'
)
WHERE user_id = 103;

-- ─────────────────────────────────────────────────────
-- CARREFOUR BIO
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop'
)
WHERE user_id = 104;

-- ─────────────────────────────────────────────────────
-- VÉLO VERT MAROC
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&h=400&fit=crop'
)
WHERE user_id = 105;

-- ─────────────────────────────────────────────────────
-- SPA NATURE & SENS
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=600&h=400&fit=crop'
)
WHERE user_id = 106;

-- ─────────────────────────────────────────────────────
-- LIBRAIRIE PAPIER RECYCLÉ
-- ─────────────────────────────────────────────────────
UPDATE partenaires 
SET gallery_images = JSON_ARRAY(
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&h=400&fit=crop'
)
WHERE user_id = 107;

-- =====================================================
-- Vérification
-- =====================================================
SELECT 
    name,
    category,
    CASE 
        WHEN gallery_images IS NOT NULL THEN JSON_LENGTH(gallery_images)
        ELSE 0
    END as nb_photos
FROM partenaires
WHERE user_id >= 101 AND user_id <= 107;
