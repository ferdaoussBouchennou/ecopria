-- =====================================================
-- DONNÉES DE DÉMONSTRATION POUR SERVICE-RECOMPENSE
-- Partenaires avec images et offres réalistes
-- =====================================================

USE db_recompense;

-- =====================================================
-- NETTOYAGE (optionnel - à décommenter si besoin)
-- =====================================================
-- DELETE FROM commissions;
-- DELETE FROM avis_partenaire;
-- DELETE FROM mystere_box_items;
-- DELETE FROM coupons;
-- DELETE FROM recompenses;
-- DELETE FROM partenaires;

-- =====================================================
-- 1. PARTENAIRES (Restaurants, Mode, Mobilité, etc.)
-- =====================================================

-- Restaurant Café Botanique (déjà existant - mise à jour)
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, instagram_url, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(101, 'Café Botanique', 'Restauration', '12 Rue des Fleurs', 'Casablanca', 
'Restaurant bio et local avec une carte végétarienne. Cuisine de saison dans un cadre verdoyant. Produits frais issus de circuits courts.',
'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
'+212 522 123 456', 'https://cafebotanique.ma', '@cafebotanique',
'Lun-Sam: 9h-22h, Dim: 10h-18h', 1520, 340, 10.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  category = VALUES(category),
  address = VALUES(address),
  city = VALUES(city),
  phone = VALUES(phone),
  website = VALUES(website),
  instagram_url = VALUES(instagram_url),
  opening_hours = VALUES(opening_hours),
  updated_at = NOW();

-- Zara Maroc
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, instagram_url, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(102, 'Zara Maroc', 'Mode & Textile', 'Morocco Mall, Boulevard de la Corniche', 'Casablanca',
'Mode durable et collections éco-responsables. Engagement pour le recyclage textile et matériaux durables.',
'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
'+212 522 987 654', 'https://zara.com/ma', '@zara',
'Lun-Dim: 10h-22h', 2840, 625, 8.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  updated_at = NOW();

-- Restaurant Le Jardin Secret
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, instagram_url, facebook_url, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(103, 'Le Jardin Secret', 'Restauration', '45 Avenue Hassan II', 'Rabat',
'Restaurant gastronomique engagé pour le zéro déchet. Cuisine raffinée avec des ingrédients bio et locaux.',
'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
'+212 537 456 789', 'https://lejardinsecret.ma', '@jardinsecret', 'https://facebook.com/jardinsecret',
'Mar-Dim: 12h-23h, Fermé Lundi', 980, 210, 12.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  updated_at = NOW();

-- Carrefour Bio
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(104, 'Carrefour Bio', 'Alimentation', 'Centre Commercial Anfaplace', 'Casablanca',
'Supermarché bio avec rayon zéro déchet. Large sélection de produits biologiques, locaux et équitables.',
'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=600&fit=crop',
'+212 522 333 444', 'https://carrefour.ma/bio',
'Lun-Dim: 8h-21h', 1650, 420, 7.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  updated_at = NOW();

-- Vélo Vert Maroc
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, instagram_url, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(105, 'Vélo Vert Maroc', 'Mobilité', '78 Rue Ibn Toumert', 'Marrakech',
'Location et vente de vélos électriques. Service de réparation et entretien écologique pour tous types de vélos.',
'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&h=600&fit=crop',
'+212 524 888 999', 'https://velovert.ma', '@velovertmaroc',
'Lun-Sam: 9h-19h', 720, 165, 10.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  updated_at = NOW();

-- Spa Nature & Sens
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(106, 'Spa Nature & Sens', 'Bien-être', '25 Boulevard Zerktouni', 'Casablanca',
'Spa éco-responsable avec produits naturels et bio. Massages, soins du visage et du corps avec cosmétiques végétaux.',
'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
'+212 522 777 888', 'https://naturetsens.ma',
'Mar-Dim: 10h-20h', 890, 195, 15.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  updated_at = NOW();

-- Librairie Papier Recyclé
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at)
VALUES 
(107, 'Librairie Papier Recyclé', 'Culture & Loisirs', '33 Rue de la Liberté', 'Rabat',
'Librairie éco-responsable spécialisée en livres d''occasion et papeterie recyclée. Espace de lecture et café littéraire.',
'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop',
'+212 537 222 333',
'Lun-Sam: 9h30-19h30', 540, 125, 8.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  updated_at = NOW();

-- =====================================================
-- 2. OFFRES / RÉCOMPENSES PAR PARTENAIRE
-- =====================================================

-- ─────────────────────────────────────────────────────
-- CAFÉ BOTANIQUE (partenaire_id dépend du user_id 101)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, date_expiration, has_mystere_box, created_at, updated_at)
SELECT p.id, 
  'Menu Déjeuner Bio Complet',
  'Menu 3 plats : entrée, plat principal végétarien, dessert maison. Boisson incluse. Produits 100% bio et locaux.',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
  120, 'STOCK', NULL, 85.00, TRUE, DATE_ADD(NOW(), INTERVAL 60 DAY), FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 101
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  '15% sur toute la carte',
  'Réduction de 15% valable sur l''ensemble de notre carte, boissons comprises. Non cumulable avec d''autres offres.',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
  80, 'REDUCTION', 15, 0, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 101
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, stock, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Café & Pâtisserie Maison',
  'Un café bio au choix + une pâtisserie artisanale du jour. À consommer sur place ou à emporter.',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
  50, 'STOCK', 20, 35.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 101
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─────────────────────────────────────────────────────
-- ZARA MAROC (user_id 102)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, date_expiration, has_mystere_box, created_at, updated_at)
SELECT p.id,
  '20% sur Collection Join Life',
  'Réduction de 20% sur toute la collection éco-responsable Join Life. Vêtements fabriqués avec matériaux durables.',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
  150, 'REDUCTION', 20, 0, TRUE, DATE_ADD(NOW(), INTERVAL 45 DAY), FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 102
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Bon d''achat 250 DH',
  'Bon d''achat de 250 DH valable sur l''ensemble du magasin, toutes collections confondues. Valable 3 mois.',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop',
  200, 'REDUCTION', NULL, 250.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 102
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─────────────────────────────────────────────────────
-- LE JARDIN SECRET (user_id 103)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, stock, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Dîner Gastronomique 2 Personnes',
  'Menu dégustation 5 plats pour 2 personnes. Accord mets-vins inclus. Réservation obligatoire 48h à l''avance.',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  300, 'EXPERIENCE', 5, 650.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 103
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  '25% sur Menu du Jour',
  'Réduction de 25% sur notre menu du jour, du mardi au vendredi uniquement. Entrée + plat + dessert.',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
  100, 'REDUCTION', 25, 0, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 103
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─────────────────────────────────────────────────────
-- CARREFOUR BIO (user_id 104)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  '10% sur Rayon Bio',
  'Réduction de 10% sur l''ensemble du rayon bio et produits locaux. Valable sur tout le magasin.',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
  60, 'REDUCTION', 10, 0, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 104
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, stock, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Panier de Légumes Bio',
  'Panier de 5kg de légumes bio de saison, directement des producteurs locaux. Composition variable selon récolte.',
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=400&fit=crop',
  90, 'STOCK', 15, 120.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 104
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─────────────────────────────────────────────────────
-- VÉLO VERT MAROC (user_id 105)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, stock, valeur_dh, is_active, date_expiration, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Location Vélo Électrique 3 Jours',
  'Location d''un vélo électrique pour 3 jours. Casque et antivol inclus. Assurance tous risques comprise.',
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=400&fit=crop',
  180, 'SERVICE', 8, 250.00, TRUE, DATE_ADD(NOW(), INTERVAL 90 DAY), FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 105
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Révision Complète Gratuite',
  'Révision complète de votre vélo : freins, vitesses, pneus, chaîne. Nettoyage et graissage inclus.',
  'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&h=400&fit=crop',
  70, 'SERVICE', NULL, 80.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 105
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─────────────────────────────────────────────────────
-- SPA NATURE & SENS (user_id 106)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, stock, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Massage Relaxant 60min',
  'Massage corps complet de 60 minutes aux huiles essentielles bio. Accès au hammam inclus. Sur rendez-vous.',
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&h=400&fit=crop',
  220, 'SERVICE', 10, 350.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 106
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  '30% sur Soins Visage',
  'Réduction de 30% sur tous nos soins du visage bio. Gommage, masque et massage facial inclus.',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  130, 'REDUCTION', 30, 0, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 106
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ─────────────────────────────────────────────────────
-- LIBRAIRIE PAPIER RECYCLÉ (user_id 107)
-- ─────────────────────────────────────────────────────
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  '20% sur Livres d''Occasion',
  'Réduction de 20% sur l''ensemble de nos livres d''occasion. Tous genres confondus : romans, BD, essais.',
  'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop',
  40, 'REDUCTION', 20, 0, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 107
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, stock, valeur_dh, is_active, has_mystere_box, created_at, updated_at)
SELECT p.id,
  'Bon d''achat Papeterie 100 DH',
  'Bon d''achat de 100 DH valable sur toute notre gamme de papeterie recyclée et écologique. Valable 6 mois.',
  'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&h=400&fit=crop',
  80, 'STOCK', 25, 100.00, TRUE, FALSE, NOW(), NOW()
FROM partenaires p WHERE p.user_id = 107
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- =====================================================
-- 3. AVIS PARTENAIRES (Exemples)
-- =====================================================

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Sarah M.', 5, 'Excellente expérience au Café Botanique ! Cuisine délicieuse et cadre apaisant. Les produits sont vraiment frais.', NOW()
FROM partenaires p WHERE p.user_id = 101;

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Ahmed K.', 4, 'Très bon rapport qualité/prix. Menu bio et savoureux. Je recommande !', NOW()
FROM partenaires p WHERE p.user_id = 101;

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Leila B.', 5, 'Collection Join Life de Zara : qualité excellente et enfin des vêtements éco-responsables tendance !', NOW()
FROM partenaires p WHERE p.user_id = 102;

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Youssef T.', 5, 'Dîner exceptionnel au Jardin Secret. Service impeccable et cuisine raffinée. Une vraie pépite à Rabat.', NOW()
FROM partenaires p WHERE p.user_id = 103;

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Fatima Z.', 4, 'Super concept de vélo électrique ! Location facile et vélos en très bon état. Pratique pour découvrir Marrakech.', NOW()
FROM partenaires p WHERE p.user_id = 105;

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Nadia R.', 5, 'Massage incroyable ! Produits naturels et ambiance zen. Je reviendrai sans hésiter.', NOW()
FROM partenaires p WHERE p.user_id = 106;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
