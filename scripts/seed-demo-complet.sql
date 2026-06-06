-- =============================================================
-- Ecopria — Jeu de données de démo (TOUS les services, 1 fichier)
-- =============================================================
-- Prérequis : docker compose -f docker-compose.infra.yml up -d
-- Exécution : .\scripts\reset-and-seed-all.ps1
--
-- Comptes démo (mot de passe pour tous : Admin123!)
--   Citoyen principal : tafraouti.sanae1@gmail.com  (auth_id = 1)
--   Association       : asso@ecopria.demo         (auth_id = 20)
--   Admin             : admin@ecopria.local
--   Partenaire        : partenaire101@ecopria.demo
--
-- Catégories (5) : Compostage, Nettoyage, Reboisement, Recyclage, Sensibilisation
-- Sections 0 → 7 — une section par conteneur MySQL Docker.
-- =============================================================

SET @pwd := '$2a$10$uPXNpUOU2bjTTnbVz0KA1eSrj9X8oS4gh.ubvs37jA0Nr4PtA5pH.'; -- Admin123!

-- ─────────────────────────────────────────────────────────────
-- 0) db_auth  (mysql-auth, port 3316)
-- ─────────────────────────────────────────────────────────────
USE db_auth;

INSERT INTO users (user_id, email, password, role, is_active, is_verified, created_at) VALUES
(1,  'tafraouti.sanae1@gmail.com', @pwd, 'USER', 1, 1, NOW()),
(2,  'marie.martin@ecopria.demo',  @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 90 DAY)),
(3,  'amine.bennani@ecopria.demo', @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 80 DAY)),
(4,  'lina.alaoui@ecopria.demo',   @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 70 DAY)),
(5,  'youssef.idrissi@ecopria.demo',@pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
(6,  'sara.elamrani@ecopria.demo', @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 50 DAY)),
(7,  'omar.fassi@ecopria.demo',    @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 40 DAY)),
(8,  'nadia.raji@ecopria.demo',    @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(9,  'karim.tazi@ecopria.demo',    @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(10, 'houda.chaoui@ecopria.demo',  @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(20, 'asso@ecopria.demo',          @pwd, 'ASSOCIATION', 1, 1, DATE_SUB(NOW(), INTERVAL 120 DAY)),
(21, 'terrebleue@ecopria.demo',    @pwd, 'ASSOCIATION', 1, 1, DATE_SUB(NOW(), INTERVAL 100 DAY)),
(101,'partenaire101@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(102,'partenaire102@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(103,'partenaire103@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(104,'partenaire104@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(105,'partenaire105@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(106,'partenaire106@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(107,'partenaire107@ecopria.demo', @pwd, 'PARTNER', 1, 1, NOW()),
(11, 'leila.benjelloun@ecopria.demo', @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(12, 'rachid.ouazzani@ecopria.demo',  @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(13, 'fatima.zahra@ecopria.demo',     @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(14, 'mehdi.alami@ecopria.demo',      @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(15, 'salma.berrada@ecopria.demo',    @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(16, 'ilyas.hajji@ecopria.demo',      @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(17, 'imane.cherif@ecopria.demo',     @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(18, 'reda.mansouri@ecopria.demo',    @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(19, 'zineb.kettani@ecopria.demo',    @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(22, 'paul.dupont@ecopria.demo',      @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(23, 'emma.bernard@ecopria.demo',     @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(24, 'lucas.moreau@ecopria.demo',     @pwd, 'USER', 1, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(25, 'chloe.petit@ecopria.demo',      @pwd, 'USER', 1, 1, NOW())
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = VALUES(role),
  is_active = 1,
  is_verified = 1;

-- Admin (complément seed-admin.sql)
INSERT INTO users (email, password, role, is_active, is_verified, created_at)
VALUES ('admin@ecopria.local', @pwd, 'ADMIN', 1, 1, NOW())
ON DUPLICATE KEY UPDATE role = 'ADMIN', is_active = 1, is_verified = 1;


-- ─────────────────────────────────────────────────────────────
-- 1) db_utilisateur  (mysql-utilisateur, port 3307)
-- ─────────────────────────────────────────────────────────────
USE db_utilisateur;

INSERT INTO badges (id, name, description, icon, required_points) VALUES
(1, 'Premier Pas', 'Première action validée', '🌱', 100),
(2, 'Nettoyeur', 'A participé à 3 actions de nettoyage', '🧹', 300),
(3, 'Reboiseur', 'A planté des arbres', '🌳', 500),
(4, 'Fidèle', 'A accumulé 1000 points', '⭐', 1000),
(5, 'Champion', 'A dépassé 2000 points', '🏆', 2000),
(6, 'Ambassadeur', '10 actions validées', '🌍', 1500),
(7, 'Éco-Héros', 'Top 3 du classement mensuel', '🦸', 2500)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description),
  icon = VALUES(icon), required_points = VALUES(required_points);

INSERT INTO citizens (auth_id, first_name, last_name, email, phone, address, city, total_points, trust_score, created_at) VALUES
(1,  'Sanae',   'Tafraouti', 'tafraouti.sanae1@gmail.com', '2767851199', 'Hay Diza, Martil',           'Martil',      850, 100, DATE_SUB(NOW(), INTERVAL 200 DAY)),
(2,  'Marie',   'Martin',    'marie.martin@ecopria.demo',  '0612345601', '5 rue de la Plage',        'Marseille',   420,  98, DATE_SUB(NOW(), INTERVAL 180 DAY)),
(3,  'Amine',   'Bennani',   'amine.bennani@ecopria.demo', '0612345602', 'Quartier Maarif',          'Casablanca',  620,  95, DATE_SUB(NOW(), INTERVAL 170 DAY)),
(4,  'Lina',    'Alaoui',    'lina.alaoui@ecopria.demo',   '0612345603', 'Agdal',                    'Rabat',       510,  98, DATE_SUB(NOW(), INTERVAL 160 DAY)),
(5,  'Youssef', 'Idrissi',   'youssef.idrissi@ecopria.demo','0612345604', 'Malabata',                'Tanger',      380,  92, DATE_SUB(NOW(), INTERVAL 150 DAY)),
(6,  'Sara',    'El Amrani', 'sara.elamrani@ecopria.demo', '0612345605', 'Gueliz',                   'Marrakech',   290,  96, DATE_SUB(NOW(), INTERVAL 140 DAY)),
(7,  'Omar',    'Fassi',     'omar.fassi@ecopria.demo',    '0612345606', 'Ville Nouvelle',           'Fès',         210,  94, DATE_SUB(NOW(), INTERVAL 130 DAY)),
(8,  'Nadia',   'Raji',      'nadia.raji@ecopria.demo',    '0612345607', 'Anfa',                     'Casablanca',  740,  99, DATE_SUB(NOW(), INTERVAL 120 DAY)),
(9,  'Karim',   'Tazi',      'karim.tazi@ecopria.demo',    '0612345608', 'Hay Riad',                 'Rabat',       155,  90, DATE_SUB(NOW(), INTERVAL 110 DAY)),
(10, 'Houda',   'Chaoui',    'houda.chaoui@ecopria.demo',  '0612345609', 'Centre-ville',             'Tétouan',     95,   88, DATE_SUB(NOW(), INTERVAL 100 DAY)),
(11, 'Leïla',   'Benjelloun','leila.benjelloun@ecopria.demo','0612345610', 'Maarif',                  'Casablanca',  880,  97, DATE_SUB(NOW(), INTERVAL 95 DAY)),
(12, 'Rachid',  'Ouazzani',  'rachid.ouazzani@ecopria.demo', '0612345611', 'Hay Mohammadi',           'Casablanca',  760,  96, DATE_SUB(NOW(), INTERVAL 90 DAY)),
(13, 'Fatima',  'Zahra',     'fatima.zahra@ecopria.demo',    '0612345612', 'Souissi',                 'Rabat',       690,  98, DATE_SUB(NOW(), INTERVAL 85 DAY)),
(14, 'Mehdi',   'Alami',     'mehdi.alami@ecopria.demo',     '0612345613', 'Médina',                  'Fès',         580,  93, DATE_SUB(NOW(), INTERVAL 80 DAY)),
(15, 'Salma',   'Berrada',   'salma.berrada@ecopria.demo',   '0612345614', 'Palmeraie',               'Marrakech',   470,  95, DATE_SUB(NOW(), INTERVAL 75 DAY)),
(16, 'Ilyas',   'Hajji',     'ilyas.hajji@ecopria.demo',     '0612345615', 'Boulevard',               'Tanger',      360,  91, DATE_SUB(NOW(), INTERVAL 70 DAY)),
(17, 'Imane',   'Cherif',    'imane.cherif@ecopria.demo',    '0612345616', 'Martil centre',           'Martil',      320,  94, DATE_SUB(NOW(), INTERVAL 65 DAY)),
(18, 'Reda',    'Mansouri',  'reda.mansouri@ecopria.demo',   '0612345617', 'Agdal',                   'Rabat',       240,  89, DATE_SUB(NOW(), INTERVAL 60 DAY)),
(19, 'Zineb',   'Kettani',   'zineb.kettani@ecopria.demo',    '0612345618', 'Anfa',                    'Casablanca',  180,  87, DATE_SUB(NOW(), INTERVAL 55 DAY)),
(22, 'Paul',    'Dupont',    'paul.dupont@ecopria.demo',      '0612345619', 'La Corniche',             'Casablanca',  1250, 99, DATE_SUB(NOW(), INTERVAL 50 DAY)),
(23, 'Emma',    'Bernard',   'emma.bernard@ecopria.demo',     '0612345620', 'Hay Riad',                'Rabat',       1100, 98, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(24, 'Lucas',   'Moreau',    'lucas.moreau@ecopria.demo',     '0612345621', 'Gueliz',                  'Marrakech',   980,  97, DATE_SUB(NOW(), INTERVAL 40 DAY)),
(25, 'Chloé',   'Petit',     'chloe.petit@ecopria.demo',      '0612345622', 'Plage',                   'Martil',      65,   85, DATE_SUB(NOW(), INTERVAL 35 DAY))
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name), last_name = VALUES(last_name),
  email = VALUES(email), phone = VALUES(phone), address = VALUES(address),
  city = VALUES(city), total_points = VALUES(total_points), trust_score = VALUES(trust_score);

-- Points pour la page Mes récompenses (échanges catalogue)
UPDATE citizens SET total_points = 1500 WHERE auth_id = 1;

INSERT INTO associations (auth_id, name, email, phone, address, description, logo, city, created_at) VALUES
(20, 'Méditerranée Propre', 'asso@ecopria.demo', '0520011223',
 '12 quai du Port', 'Collecte, sensibilisation et protection du littoral.',
 'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=800&h=600&fit=crop', 'Martil', DATE_SUB(NOW(), INTERVAL 300 DAY)),
(21, 'Terre Bleue Maroc', 'terrebleue@ecopria.demo', '0537766554',
 '45 av. Mohammed V', 'Reboisement urbain et ateliers éco-citoyens.',
 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop', 'Rabat', DATE_SUB(NOW(), INTERVAL 250 DAY))
ON DUPLICATE KEY UPDATE
  name = VALUES(name), email = VALUES(email), city = VALUES(city),
  description = VALUES(description), logo = VALUES(logo);

INSERT INTO partners (auth_id, name, email, phone, address, description, category, city, created_at) VALUES
(101, 'Café Botanique',       'partenaire101@ecopria.demo', '0522111111', '12 Rue des Fleurs',        'Restaurant bio',           'Restauration',       'Casablanca', NOW()),
(102, 'Zara Maroc',           'partenaire102@ecopria.demo', '0522222222', 'Morocco Mall',             'Mode durable',             'Mode & Textile',     'Casablanca', NOW()),
(103, 'Le Jardin Secret',     'partenaire103@ecopria.demo', '0537333333', '45 Avenue Hassan II',      'Gastronomie zéro déchet',  'Restauration',       'Rabat',      NOW()),
(104, 'Carrefour Bio',        'partenaire104@ecopria.demo', '0522444444', 'Anfaplace',                'Supermarché bio',          'Alimentation',       'Casablanca', NOW()),
(105, 'Vélo Vert Maroc',      'partenaire105@ecopria.demo', '0524555555', '78 Rue Ibn Toumert',       'Mobilité douce',           'Mobilité',           'Marrakech',  NOW()),
(106, 'Spa Nature & Sens',    'partenaire106@ecopria.demo', '0522666666', '25 Bd Zerktouni',          'Bien-être naturel',        'Bien-être',          'Casablanca', NOW()),
(107, 'Librairie Papier Recyclé', 'partenaire107@ecopria.demo', '0537777777', '33 Rue Liberté',   'Livres & papeterie recyclée','Culture & Loisirs',  'Rabat',      NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city), category = VALUES(category);

INSERT INTO notification_preferences (auth_id, nearby_actions, reminders, catalog_news, newsletter) VALUES
(1, 1, 1, 1, 1), (2, 1, 1, 0, 0), (3, 1, 0, 1, 1), (4, 0, 1, 1, 0),
(5, 1, 1, 1, 1), (6, 1, 0, 0, 1), (7, 1, 1, 0, 0), (8, 1, 1, 1, 1),
(9, 0, 1, 1, 1), (10, 1, 1, 0, 0), (20, 1, 1, 1, 1), (21, 1, 0, 1, 0)
ON DUPLICATE KEY UPDATE
  nearby_actions = VALUES(nearby_actions), reminders = VALUES(reminders),
  catalog_news = VALUES(catalog_news), newsletter = VALUES(newsletter);

-- Historique points (citoyen auth_id = 1)
INSERT INTO point_history (citizen_id, amount, type, source, description, created_at)
SELECT c.id, v.amount, v.typ, v.src, v.descr, v.dt
FROM citizens c
JOIN (
  SELECT 120 AS amount, 'CREDIT' AS typ, 'action-plage-martil' AS src, 'Nettoyage plage Martil — présence validée' AS descr, DATE_SUB(NOW(), INTERVAL 45 DAY) AS dt UNION ALL
  SELECT 80,  'CREDIT', 'action-reboisement-rabat', 'Reboisement arbres Rabat', DATE_SUB(NOW(), INTERVAL 38 DAY) UNION ALL
  SELECT 50,  'CREDIT', 'action-sensibilisation-casa', 'Atelier sensibilisation Casablanca', DATE_SUB(NOW(), INTERVAL 25 DAY) UNION ALL
  SELECT 100, 'CREDIT', 'action-recyclage-tanger', 'Collecte sélective Tanger', DATE_SUB(NOW(), INTERVAL 18 DAY) UNION ALL
  SELECT 60,  'CREDIT', 'action-jardin-martil', 'Jardin partagé Martil', DATE_SUB(NOW(), INTERVAL 10 DAY) UNION ALL
  SELECT 40,  'CREDIT', 'bonus-parrainage', 'Bonus parrainage ami', DATE_SUB(NOW(), INTERVAL 5 DAY) UNION ALL
  SELECT 30,  'DEBIT',  'coupon-cafe-15', 'Échange coupon Café Botanique', DATE_SUB(NOW(), INTERVAL 3 DAY) UNION ALL
  SELECT 55,  'CREDIT', 'action-velo-marrakech', 'Atelier mobilité Marrakech', DATE_SUB(NOW(), INTERVAL 42 DAY) UNION ALL
  SELECT 45,  'CREDIT', 'action-compost-casa', 'Atelier compost Casablanca', DATE_SUB(NOW(), INTERVAL 32 DAY) UNION ALL
  SELECT 70,  'CREDIT', 'action-spa-bonus', 'Bonus bien-être partenaire', DATE_SUB(NOW(), INTERVAL 22 DAY) UNION ALL
  SELECT 25,  'DEBIT',  'coupon-livres-20', 'Échange librairie recyclée', DATE_SUB(NOW(), INTERVAL 12 DAY) UNION ALL
  SELECT 35,  'DEBIT',  'coupon-zara-join', 'Échange Zara Join Life', DATE_SUB(NOW(), INTERVAL 8 DAY) UNION ALL
  SELECT 90,  'CREDIT', 'action-massage-demo', 'Massage spa démo', DATE_SUB(NOW(), INTERVAL 15 DAY) UNION ALL
  SELECT 40,  'CREDIT', 'action-librairie-rabat', 'Stand librairie Rabat', DATE_SUB(NOW(), INTERVAL 7 DAY) UNION ALL
  SELECT 20,  'DEBIT',  'coupon-smoothie', 'Smoothie detox', DATE_SUB(NOW(), INTERVAL 2 DAY) UNION ALL
  SELECT 15,  'DEBIT',  'coupon-revision-velo', 'Révision vélo', DATE_SUB(NOW(), INTERVAL 1 DAY)
) v ON c.auth_id = 1
WHERE NOT EXISTS (SELECT 1 FROM point_history h WHERE h.citizen_id = c.id AND h.source = v.src);

INSERT INTO point_history (citizen_id, amount, type, source, description, created_at)
SELECT c.id, 90, 'CREDIT', 'action-bonus-nadia', 'Action groupée avec Nadia', DATE_SUB(NOW(), INTERVAL 20 DAY)
FROM citizens c WHERE c.auth_id = 8
  AND NOT EXISTS (SELECT 1 FROM point_history h WHERE h.citizen_id = c.id AND h.source = 'action-bonus-nadia');

INSERT INTO user_badges (citizen_id, badge_id, obtained_at)
SELECT c.id, b.badge_id, b.obt
FROM citizens c
JOIN (
  SELECT 1 AS badge_id, DATE_SUB(NOW(), INTERVAL 40 DAY) AS obt UNION ALL
  SELECT 2, DATE_SUB(NOW(), INTERVAL 30 DAY) UNION ALL
  SELECT 3, DATE_SUB(NOW(), INTERVAL 15 DAY) UNION ALL
  SELECT 4, DATE_SUB(NOW(), INTERVAL 5 DAY)
) b ON c.auth_id = 1
WHERE NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.citizen_id = c.id AND ub.badge_id = b.badge_id);

INSERT INTO user_badges (citizen_id, badge_id, obtained_at)
SELECT c.id, 1, DATE_SUB(NOW(), INTERVAL 60 DAY) FROM citizens c WHERE c.auth_id IN (3, 4, 8)
  AND NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.citizen_id = c.id AND ub.badge_id = 1);


-- ─────────────────────────────────────────────────────────────
-- 2) db_action  (mysql-action, port 3308)
-- ─────────────────────────────────────────────────────────────
USE db_action;

INSERT INTO associations (user_id, name, description, logo_url, city, is_validated, created_at, updated_at) VALUES
(20, 'Méditerranée Propre', 'Protection du littoral et sensibilisation.',
 'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=800&h=600&fit=crop', 'Martil', 1, NOW(), NOW()),
(21, 'Terre Bleue Maroc', 'Reboisement et jardins urbains.',
 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop', 'Rabat', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city), logo_url = VALUES(logo_url), is_validated = 1;

INSERT INTO categories (name, description, image_url, published)
SELECT * FROM (
  SELECT 'Compostage' AS n, 'Reboisement et espaces verts' AS d,
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop' AS img, 1 AS pub UNION ALL
  SELECT 'Nettoyage', 'Actions de collecte',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=800&h=600&fit=crop', 1 UNION ALL
  SELECT 'Reboisement', 'Protection faune et flore',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop', 1 UNION ALL
  SELECT 'Recyclage', 'Tri et économie circulaire',
    'https://images.unsplash.com/photo-1611288588316-0d9c9c4d2c5e?w=800&h=600&fit=crop', 1 UNION ALL
  SELECT 'Sensibilisation', 'Ateliers et conférences',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop', 1
) t WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = t.n);

-- Actions publiées / passées / brouillons (ids fixes 1–26 pour db_inscription / db_presence)
INSERT INTO actions (id, title, description, category_id, latitude, longitude, address, city,
  date_start, date_end, points, max_participants, available_places, association_id, status, is_fixed, created_at, updated_at)
SELECT t.id, t.title, t.descr, (SELECT id FROM categories WHERE name = t.cat LIMIT 1),
  t.lat, t.lng, t.addr, t.city, t.ds, t.de, t.pts, t.maxp, t.avail,
  (SELECT id FROM associations WHERE user_id = t.asso_uid LIMIT 1), t.st, 0, NOW(), NOW()
FROM (
  SELECT 1 AS id, 'Grande journée de nettoyage de la plage de Martil' AS title,
    'Ramassage des déchets, tri et sensibilisation sur la côte.' AS descr, 'Nettoyage' AS cat,
    35.2700 AS lat, -5.3100 AS lng, 'Plage de Martil' AS addr, 'Martil' AS city,
    DATE_ADD(NOW(), INTERVAL 7 DAY) AS ds, DATE_ADD(DATE_ADD(NOW(), INTERVAL 7 DAY), INTERVAL 4 HOUR) AS de,
    50 AS pts, 40 AS maxp, 32 AS avail, 20 AS asso_uid, 'PUBLISHED' AS st
  UNION ALL SELECT 2, 'Plantation d''arbres — forêt urbaine Rabat', 'Plantation de 200 arbustes natifs.', 'Reboisement',
    34.0209, -6.8416, 'Forêt urbaine Agdal', 'Rabat', DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 14 DAY), INTERVAL 5 HOUR),
    80, 25, 18, 21, 'PUBLISHED'
  UNION ALL SELECT 3, 'Atelier recyclage & zéro déchet — Casablanca', 'Initiation au tri et DIY réemploi.', 'Recyclage',
    33.5731, -7.5898, 'Maison de l''environnement', 'Casablanca', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 3 HOUR),
    40, 50, 41, 20, 'PUBLISHED'
  UNION ALL SELECT 4, 'Nettoyage littoral — Tanger Med', 'Action coordonnée avec pêcheurs locaux.', 'Nettoyage',
    35.7595, -5.8340, 'Port de pêche', 'Tanger', DATE_ADD(NOW(), INTERVAL 21 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 21 DAY), INTERVAL 4 HOUR),
    60, 30, 30, 20, 'PUBLISHED'
  UNION ALL SELECT 5, 'Jardin partagé — Martil centre', 'Entretien parcelles et compost.', 'Compostage',
    35.2650, -5.3050, 'Jardin municipal', 'Martil', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 10 DAY), INTERVAL 2 HOUR),
    35, 20, 12, 20, 'PUBLISHED'
  UNION ALL SELECT 6, 'Conférence climat — lycées Rabat', 'Interventions et stands partenaires.', 'Sensibilisation',
    34.0100, -6.8300, 'Lycée Hassan II', 'Rabat', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 30 DAY), INTERVAL 2 HOUR),
    25, 100, 95, 21, 'PUBLISHED'
  UNION ALL SELECT 7, 'Collecte déchets électroniques — Casa', 'DEEE et sensibilisation numérique responsable.', 'Recyclage',
    33.5800, -7.6000, 'Technopark', 'Casablanca', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 20 DAY), INTERVAL 4 HOUR),
    70, 35, 0, 20, 'COMPLETED'
  UNION ALL SELECT 8, 'Reboisement colline — Fès', 'Plantation de pins et oliviers.', 'Reboisement',
    34.0330, -5.0000, 'Colline Saiss', 'Fès', DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 35 DAY), INTERVAL 6 HOUR),
    90, 20, 0, 21, 'COMPLETED'
  UNION ALL SELECT 9, 'Nettoyage wadi — Marrakech', 'Action annulée (intempéries).', 'Nettoyage',
    31.6295, -7.9811, 'Oued Issil', 'Marrakech', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 5 DAY), INTERVAL 3 HOUR),
    45, 25, 25, 20, 'CANCELLED'
  UNION ALL SELECT 10, 'Brouillon — action test association', 'Non publiée.', 'Sensibilisation',
    35.2700, -5.3100, 'Martil', 'Martil', DATE_ADD(NOW(), INTERVAL 60 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 60 DAY), INTERVAL 1 HOUR),
    10, 10, 10, 20, 'DRAFT'
  UNION ALL SELECT 11, 'Scan QR démo — présence aujourd''hui Martil', 'Action du jour pour tester le scanner.', 'Nettoyage',
    35.2680, -5.3080, 'Plage Martil — zone B', 'Martil',
    TIMESTAMP(CURDATE(), '10:00:00'), TIMESTAMP(CURDATE(), '14:00:00'),
    45, 30, 28, 20, 'PUBLISHED'
  UNION ALL SELECT 12, 'Tri sélectif quartier — Casablanca', 'Porte-à-porte et stands de tri.', 'Recyclage',
    33.5750, -7.5920, 'Quartier Maarif', 'Casablanca', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 5 DAY), INTERVAL 3 HOUR),
    55, 40, 35, 20, 'PUBLISHED'
  UNION ALL SELECT 13, 'Sensibilisation écoles — Rabat', 'Ateliers CM2 et collège.', 'Sensibilisation',
    34.0150, -6.8350, 'École Al Irfane', 'Rabat', DATE_ADD(NOW(), INTERVAL 8 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 8 DAY), INTERVAL 2 HOUR),
    30, 60, 55, 21, 'PUBLISHED'
  UNION ALL SELECT 14, 'Nettoyage forêt littorale — Martil', 'Ramassage sentiers côtiers.', 'Nettoyage',
    35.2720, -5.3120, 'Forêt littorale', 'Martil', DATE_ADD(NOW(), INTERVAL 12 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 12 DAY), INTERVAL 4 HOUR),
    65, 25, 20, 20, 'PUBLISHED'
  UNION ALL SELECT 15, 'Plantation oliviers — Tétouan', '100 plants en zone agricole.', 'Reboisement',
    35.5700, -5.3700, 'Campagne Tétouan', 'Tétouan', DATE_ADD(NOW(), INTERVAL 18 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 18 DAY), INTERVAL 5 HOUR),
    85, 35, 30, 21, 'PUBLISHED'
  UNION ALL SELECT 16, 'Biodiversité mangrove — Larache', 'Protection zones humides.', 'Reboisement',
    35.1900, -6.1500, 'Mangrove Larache', 'Larache', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 25 DAY), INTERVAL 4 HOUR),
    75, 20, 18, 20, 'PUBLISHED'
  UNION ALL SELECT 17, 'Recyclage créatif — Marrakech', 'DIY et atelier réemploi.', 'Recyclage',
    31.6300, -7.9820, 'FabLab Gueliz', 'Marrakech', DATE_ADD(NOW(), INTERVAL 35 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 35 DAY), INTERVAL 3 HOUR),
    50, 45, 40, 21, 'PUBLISHED'
  UNION ALL SELECT 18, 'Nettoyage plage 2024 — Martil (archivée)', 'Action passée archivée.', 'Nettoyage',
    35.2700, -5.3100, 'Plage Martil', 'Martil', DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 90 DAY), INTERVAL 4 HOUR),
    50, 30, 0, 20, 'COMPLETED'
  UNION ALL SELECT 19, 'Plantation 2024 — Rabat (archivée)', 'Action passée archivée.', 'Reboisement',
    34.0200, -6.8400, 'Agdal', 'Rabat', DATE_SUB(NOW(), INTERVAL 85 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 85 DAY), INTERVAL 5 HOUR),
    80, 25, 0, 21, 'COMPLETED'
  UNION ALL SELECT 20, 'Atelier recyclage 2024 — Casa (archivée)', 'Action passée archivée.', 'Recyclage',
    33.5730, -7.5900, 'Casa', 'Casablanca', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 80 DAY), INTERVAL 3 HOUR),
    40, 50, 0, 20, 'COMPLETED'
  UNION ALL SELECT 21, 'Sensibilisation 2024 — Tanger (archivée)', 'Action passée archivée.', 'Sensibilisation',
    35.7600, -5.8300, 'Tanger', 'Tanger', DATE_SUB(NOW(), INTERVAL 75 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 75 DAY), INTERVAL 2 HOUR),
    25, 100, 0, 20, 'COMPLETED'
  UNION ALL SELECT 22, 'Jardin 2024 — Martil (archivée)', 'Action passée archivée.', 'Compostage',
    35.2650, -5.3050, 'Martil', 'Martil', DATE_SUB(NOW(), INTERVAL 70 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 70 DAY), INTERVAL 2 HOUR),
    35, 20, 0, 20, 'COMPLETED'
  UNION ALL SELECT 23, 'Collecte DEEE 2024 — Casa (archivée)', 'Action passée archivée.', 'Recyclage',
    33.5800, -7.6000, 'Technopark', 'Casablanca', DATE_SUB(NOW(), INTERVAL 65 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 65 DAY), INTERVAL 4 HOUR),
    70, 35, 0, 20, 'COMPLETED'
  UNION ALL SELECT 24, 'Reboisement 2024 — Fès (archivée)', 'Action passée archivée.', 'Reboisement',
    34.0330, -5.0000, 'Fès', 'Fès', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 60 DAY), INTERVAL 6 HOUR),
    90, 20, 0, 21, 'COMPLETED'
  UNION ALL SELECT 25, 'Nettoyage wadi 2024 — Marrakech (archivée)', 'Action passée archivée.', 'Nettoyage',
    31.6295, -7.9811, 'Marrakech', 'Marrakech', DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 55 DAY), INTERVAL 3 HOUR),
    45, 25, 0, 20, 'COMPLETED'
  UNION ALL SELECT 26, 'Conférence climat 2024 — Rabat (archivée)', 'Action passée archivée.', 'Sensibilisation',
    34.0100, -6.8300, 'Rabat', 'Rabat', DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 50 DAY), INTERVAL 2 HOUR),
    25, 100, 0, 21, 'COMPLETED'
) t
WHERE NOT EXISTS (SELECT 1 FROM actions a WHERE a.id = t.id)
  ON DUPLICATE KEY UPDATE
  title = VALUES(title), status = VALUES(status), points = VALUES(points),
  available_places = VALUES(available_places), updated_at = NOW();

-- Actions fixes (modèles admin) — visibles dans le catalogue (filtre source « fixed »)
INSERT INTO actions (id, title, description, category_id, latitude, longitude, address, city,
  date_start, date_end, points, max_participants, available_places, association_id, status, is_fixed, action_fixe_id, created_at, updated_at)
SELECT t.id, t.title, t.descr, (SELECT id FROM categories WHERE name = t.cat LIMIT 1),
  33.5731, -7.5898, 'Template Ecopria', 'Plateforme',
  DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 365 DAY),
  t.pts, 999, 999, (SELECT id FROM associations WHERE user_id = 20 LIMIT 1), 'PUBLISHED', 1, t.fixe_id, NOW(), NOW()
FROM (
  SELECT 27 AS id, 'Nettoyage de plage type' AS title, 'Modèle national plage — action fixe Ecopria' AS descr, 'Nettoyage' AS cat, 50 AS pts, 1 AS fixe_id
  UNION ALL SELECT 28, 'Reboisement urbain type', 'Modèle reboisement ville — action fixe Ecopria', 'Reboisement', 80, 2
  UNION ALL SELECT 29, 'Atelier zéro déchet type', 'Modèle atelier — action fixe Ecopria', 'Sensibilisation', 30, 3
) t
WHERE NOT EXISTS (SELECT 1 FROM actions a WHERE a.id = t.id)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), status = 'PUBLISHED', is_fixed = 1, action_fixe_id = VALUES(action_fixe_id), updated_at = NOW();

-- Programme & infos pratiques (première action Martil si présente)
INSERT INTO action_program (action_id, step, step_order)
SELECT a.id, s.step, s.ord FROM actions a
JOIN (
  SELECT '09:00 — Accueil & café solidaire' AS step, 0 AS ord UNION ALL
  SELECT '09:30 — Briefing sécurité', 1 UNION ALL
  SELECT '10:00 — Collecte zone A', 2 UNION ALL
  SELECT '12:00 — Tri et pesée', 3 UNION ALL
  SELECT '13:00 — Clôture & points', 4
) s ON a.title LIKE '%Martil%' AND a.status = 'PUBLISHED'
WHERE NOT EXISTS (SELECT 1 FROM action_program p WHERE p.action_id = a.id);

INSERT INTO action_infos (action_id, info)
SELECT a.id, i.info FROM actions a
JOIN (
  SELECT 'Gants et sacs fournis' AS info UNION ALL
  SELECT 'Prévoir chaussures fermées' UNION ALL
  SELECT 'Certificat de participation disponible'
) i ON a.title LIKE '%Martil%' AND a.status = 'PUBLISHED'
WHERE NOT EXISTS (SELECT 1 FROM action_infos x WHERE x.action_id = a.id AND x.info = i.info);

INSERT INTO action_photos (action_id, url, filename, uploaded_at)
SELECT a.id, 'https://images.unsplash.com/photo-1618477247221-7852f329edca?w=800',
  'plage-martil.jpg', NOW()
FROM actions a WHERE a.title LIKE '%Martil%' AND a.status = 'PUBLISHED'
  AND NOT EXISTS (SELECT 1 FROM action_photos p WHERE p.action_id = a.id);


-- ─────────────────────────────────────────────────────────────
-- 3) db_inscription  (mysql-inscription, port 3309)
-- Prérequis : section 2) db_action déjà exécutée (action_id 1–26)
-- ─────────────────────────────────────────────────────────────
USE db_inscription;

INSERT INTO inscriptions (user_id, action_id, date_inscription, statut, points_action,
  motivation, image_rights, newsletter, penalise,
  participant_first_name, participant_last_name, participant_email, participant_city)
SELECT v.uid, v.action_id, v.dt, v.statut, v.pts, v.mot, 1, v.nl, v.pen,
  v.fn, v.ln, v.em, v.city
FROM (
  SELECT 1 AS uid, 1 AS action_id, 50 AS pts, 'CONFIRMEE' AS statut, NOW() AS dt,
    'Motivée par la protection du littoral' AS mot, 0 AS nl, 0 AS pen,
    'Sanae' AS fn, 'Tafraouti' AS ln, 'tafraouti.sanae1@gmail.com' AS em, 'Martil' AS city
  UNION ALL SELECT 1, 5, 35, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Venir avec mes enfants', 1, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 2, 80, 'EN_ATTENTE', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Places limitées', 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 3, 3, 40, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 1, 0,
    'Amine', 'Bennani', 'amine.bennani@ecopria.demo', 'Casablanca'
  UNION ALL SELECT 4, 4, 60, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 0, 0,
    'Lina', 'Alaoui', 'lina.alaoui@ecopria.demo', 'Rabat'
  UNION ALL SELECT 8, 1, 50, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 1, 0,
    'Nadia', 'Raji', 'nadia.raji@ecopria.demo', 'Casablanca'
  UNION ALL SELECT 5, 9, 45, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Empêchement', 0, 0,
    'Youssef', 'Idrissi', 'youssef.idrissi@ecopria.demo', 'Tanger'
  UNION ALL SELECT 1, 3, 40, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Atelier recyclage', 1, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 4, 60, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 6, 25, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 1, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 11, 45, 'CONFIRMEE', NOW(), 'Test scanner QR du jour', 1, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 12, 55, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 13, 30, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 14, 65, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 1, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 15, 85, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 16, 75, 'EN_ATTENTE', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Liste d''attente mangrove', 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 17, 50, 'EN_ATTENTE', NOW(), 'Liste d''attente Marrakech', 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 8, 90, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 40 DAY), 'Empêchement personnel', 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 7, 70, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 25 DAY), 'Doublon annulé (présence via scan)', 0, 0,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 2, 1, 50, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 1, 0,
    'Marie', 'Martin', 'marie.martin@ecopria.demo', 'Marseille'
  UNION ALL SELECT 11, 11, 45, 'CONFIRMEE', NOW(), NULL, 1, 0,
    'Leïla', 'Benjelloun', 'leila.benjelloun@ecopria.demo', 'Casablanca'
  UNION ALL SELECT 22, 2, 80, 'CONFIRMEE', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 0, 0,
    'Paul', 'Dupont', 'paul.dupont@ecopria.demo', 'Casablanca'
  UNION ALL SELECT 1, 18, 50, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 88 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 19, 80, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 83 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 20, 40, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 78 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 21, 25, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 73 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 22, 35, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 68 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 23, 70, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 63 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 24, 90, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 58 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 25, 45, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 53 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
  UNION ALL SELECT 1, 26, 25, 'ANNULEE', DATE_SUB(NOW(), INTERVAL 48 DAY), 'Absent — historique pagination', 0, 1,
    'Sanae', 'Tafraouti', 'tafraouti.sanae1@gmail.com', 'Martil'
) v
WHERE NOT EXISTS (SELECT 1 FROM inscriptions i WHERE i.user_id = v.uid AND i.action_id = v.action_id);


-- ─────────────────────────────────────────────────────────────
-- 4) db_presence  (mysql-presence, port 3310)
-- Prérequis : section 2) db_action (action_id 1–10)
-- ─────────────────────────────────────────────────────────────
USE db_presence;

INSERT INTO presences (user_id, action_id, points, date_validation, statut)
SELECT v.uid, v.action_id, v.pts, v.dt, 'VALIDE'
FROM (
  SELECT 1 AS uid, 7 AS action_id, 70 AS pts, DATE_SUB(NOW(), INTERVAL 20 DAY) AS dt UNION ALL
  SELECT 1, 8, 90, DATE_SUB(NOW(), INTERVAL 35 DAY) UNION ALL
  SELECT 3, 7, 70, DATE_SUB(NOW(), INTERVAL 20 DAY) UNION ALL
  SELECT 8, 8, 90, DATE_SUB(NOW(), INTERVAL 35 DAY)
) v
WHERE NOT EXISTS (SELECT 1 FROM presences p WHERE p.user_id = v.uid AND p.action_id = v.action_id);

-- PIN démo action du jour (11) : voir qrcodes_actions.pin_code pour user_id=1

INSERT INTO qrcodes_actions (action_id, qr_code, pin_code, points, date_creation)
SELECT m.action_id,
  CONCAT('DEMO-QR-', m.action_id, '-', MD5(CONCAT(m.action_id, m.label))),
  LPAD(MOD(m.action_id * 7919, 1000000), 6, '0'),
  m.pts, NOW()
FROM (
  SELECT 1 AS action_id, 50 AS pts, 'martil' AS label UNION ALL
  SELECT 2, 80, 'rabat' UNION ALL
  SELECT 3, 40, 'casa' UNION ALL
  SELECT 4, 60, 'tanger' UNION ALL
  SELECT 5, 35, 'jardin' UNION ALL
  SELECT 6, 25, 'conference' UNION ALL
  SELECT 7, 70, 'deee' UNION ALL
  SELECT 8, 90, 'fes' UNION ALL
  SELECT 11, 45, 'scan-today' UNION ALL
  SELECT 12, 55, 'tri-casa' UNION ALL
  SELECT 13, 30, 'ecoles-rabat' UNION ALL
  SELECT 14, 65, 'foret-martil' UNION ALL
  SELECT 15, 85, 'oliviers-tetouan' UNION ALL
  SELECT 16, 75, 'mangrove' UNION ALL
  SELECT 17, 50, 'diy-marrakech'
) m
WHERE NOT EXISTS (SELECT 1 FROM qrcodes_actions q WHERE q.action_id = m.action_id);


-- ─────────────────────────────────────────────────────────────
-- 5) db_recompense  (phpMyAdmin → serveur mysql-recompense UNIQUEMENT)
-- Page /espace/recompenses : catalogue + coupons + points (auth_id = user_id coupons)
-- ─────────────────────────────────────────────────────────────
USE db_recompense;

-- Partenaires (7)
INSERT INTO partenaires (user_id, name, category, address, city, description, image_url, phone, website, instagram_url, opening_hours, vues_profil, clics_offres, commission_rate, created_at, updated_at) VALUES
(101, 'Café Botanique', 'Restauration', '12 Rue des Fleurs', 'Casablanca', 'Restaurant bio local.', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop', '+212522123456', 'https://cafebotanique.ma', '@cafebotanique', 'Lun-Sam 9h-22h', 1520, 340, 10.0, NOW(), NOW()),
(102, 'Zara Maroc', 'Mode & Textile', 'Morocco Mall', 'Casablanca', 'Mode durable Join Life.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', '+212522987654', 'https://zara.com/ma', '@zara', 'Lun-Dim 10h-22h', 2840, 625, 8.0, NOW(), NOW()),
(103, 'Le Jardin Secret', 'Restauration', '45 Av. Hassan II', 'Rabat', 'Gastronomie zéro déchet.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', '+212537456789', 'https://lejardinsecret.ma', '@jardinsecret', 'Mar-Dim 12h-23h', 980, 210, 12.0, NOW(), NOW()),
(104, 'Carrefour Bio', 'Alimentation', 'Anfaplace', 'Casablanca', 'Supermarché bio.', 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=600&fit=crop', '+212522333444', 'https://carrefour.ma/bio', NULL, 'Lun-Dim 8h-21h', 1650, 420, 7.0, NOW(), NOW()),
(105, 'Vélo Vert Maroc', 'Mobilité', '78 Rue Ibn Toumert', 'Marrakech', 'Vélos électriques.', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&h=600&fit=crop', '+212524888999', 'https://velovert.ma', '@velovertmaroc', 'Lun-Sam 9h-19h', 720, 165, 10.0, NOW(), NOW()),
(106, 'Spa Nature & Sens', 'Bien-être', '25 Bd Zerktouni', 'Casablanca', 'Spa bio.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop', '+212522777888', 'https://naturetsens.ma', NULL, 'Mar-Dim 10h-20h', 890, 195, 15.0, NOW(), NOW()),
(107, 'Librairie Papier Recyclé', 'Culture & Loisirs', '33 Rue Liberté', 'Rabat', 'Livres et papeterie recyclée.', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop', '+212537222333', NULL, NULL, 'Lun-Sam 9h30-19h30', 540, 125, 8.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- Catalogue (~18 offres)
INSERT INTO recompenses (partenaire_id, title, description, image_url, points_necessaires, type, discount_percentage, stock, valeur_dh, is_active, date_expiration, has_mystere_box, mystere_box_points, created_at, updated_at)
SELECT p.id, t.title, t.descr, t.img, t.pts, t.typ, t.disc, t.stk, t.val, 1, t.exp, t.mbox, t.mpts, NOW(), NOW()
FROM partenaires p
JOIN (
  SELECT 101 AS uid, 'Menu Déjeuner Bio Complet' AS title, 'Menu 3 plats bio.' AS descr, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop' AS img, 120 AS pts, 'STOCK' AS typ, NULL AS disc, 30 AS stk, 85.0 AS val, DATE_ADD(NOW(), INTERVAL 90 DAY) AS exp, 0 AS mbox, NULL AS mpts
  UNION ALL SELECT 101, '15% sur toute la carte', 'Réduction 15%.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop', 80, 'REDUCTION', 15, NULL, 0, NULL, 1, 60
  UNION ALL SELECT 101, 'Café & Pâtisserie Maison', 'Café + pâtisserie.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop', 50, 'STOCK', NULL, 50, 35.0, NULL, 0, NULL
  UNION ALL SELECT 101, 'Smoothie Detox Gratuit', 'Smoothie offert.', 'https://images.unsplash.com/photo-1610970881329-b4693fffe1a3?w=600&h=400&fit=crop', 35, 'STOCK', NULL, 100, 25.0, NULL, 0, NULL
  UNION ALL SELECT 102, '20% sur Collection Join Life', 'Réduction Zara Join Life.', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop', 150, 'REDUCTION', 20, NULL, 0, DATE_ADD(NOW(), INTERVAL 60 DAY), 0, NULL
  UNION ALL SELECT 102, 'Bon d''achat 250 DH', 'Bon 250 DH.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop', 200, 'REDUCTION', NULL, NULL, 250.0, NULL, 0, NULL
  UNION ALL SELECT 103, 'Dîner Gastronomique 2 Personnes', 'Menu 5 plats.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', 300, 'EXPERIENCE', NULL, 5, 650.0, NULL, 0, NULL
  UNION ALL SELECT 103, '25% sur Menu du Jour', 'Réduction menu jour.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop', 100, 'REDUCTION', 25, NULL, 0, NULL, 0, NULL
  UNION ALL SELECT 104, '10% sur Rayon Bio', 'Réduction rayon bio.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop', 60, 'REDUCTION', 10, NULL, 0, NULL, 0, NULL
  UNION ALL SELECT 104, 'Panier de Légumes Bio', 'Panier 5 kg.', 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=400&fit=crop', 90, 'STOCK', NULL, 20, 120.0, NULL, 0, NULL
  UNION ALL SELECT 104, 'Atelier Compost Maison', 'Atelier compost 2h.', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=400&fit=crop', 55, 'EXPERIENCE', NULL, 15, 45.0, NULL, 0, NULL
  UNION ALL SELECT 105, 'Location Vélo Électrique 3 Jours', 'Vélo 3 jours.', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=400&fit=crop', 180, 'SERVICE', NULL, 8, 250.0, DATE_ADD(NOW(), INTERVAL 120 DAY), 0, NULL
  UNION ALL SELECT 105, 'Révision Complète Gratuite', 'Révision vélo.', 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&h=400&fit=crop', 70, 'SERVICE', NULL, NULL, 80.0, NULL, 0, NULL
  UNION ALL SELECT 106, 'Massage Relaxant 60min', 'Massage 60 min.', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&h=400&fit=crop', 220, 'SERVICE', NULL, 12, 350.0, NULL, 0, NULL
  UNION ALL SELECT 106, '30% sur Soins Visage', 'Réduction soins.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop', 130, 'REDUCTION', 30, NULL, 0, NULL, 0, NULL
  UNION ALL SELECT 107, '20% sur Livres d''Occasion', 'Réduction livres.', 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop', 40, 'REDUCTION', 20, NULL, 0, NULL, 0, NULL
  UNION ALL SELECT 107, 'Bon d''achat Papeterie 100 DH', 'Bon papeterie.', 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&h=400&fit=crop', 80, 'STOCK', NULL, 30, 100.0, NULL, 0, NULL
) t ON p.user_id = t.uid
WHERE NOT EXISTS (SELECT 1 FROM recompenses r WHERE r.title = t.title AND r.partenaire_id = p.id);

UPDATE recompenses r JOIN partenaires p ON r.partenaire_id = p.id
SET r.has_mystere_box = 1, r.mystere_box_points = 60
WHERE p.user_id = 101 AND r.title = '15% sur toute la carte';

INSERT INTO mystere_box_items (recompense_id, titre, description, probabilite)
SELECT r.id, '-5% seulement', 'Min', 50 FROM recompenses r WHERE r.title = '15% sur toute la carte'
  AND NOT EXISTS (SELECT 1 FROM mystere_box_items m WHERE m.recompense_id = r.id AND m.titre = '-5% seulement');
INSERT INTO mystere_box_items (recompense_id, titre, description, probabilite)
SELECT r.id, '-25% surprise', 'Surprise', 35 FROM recompenses r WHERE r.title = '15% sur toute la carte'
  AND NOT EXISTS (SELECT 1 FROM mystere_box_items m WHERE m.recompense_id = r.id AND m.titre = '-25% surprise');
INSERT INTO mystere_box_items (recompense_id, titre, description, probabilite)
SELECT r.id, '-50% jackpot', 'Jackpot', 15 FROM recompenses r WHERE r.title = '15% sur toute la carte'
  AND NOT EXISTS (SELECT 1 FROM mystere_box_items m WHERE m.recompense_id = r.id AND m.titre = '-50% jackpot');

-- Coupons user_id = 1 (remplacer 1 par votre auth_id si différent)
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-001', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 28 DAY), NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM recompenses r WHERE r.title = 'Café & Pâtisserie Maison' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-001');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-002', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 20 DAY), NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM recompenses r WHERE r.title = '15% sur toute la carte' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-002');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-003', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 15 DAY), NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM recompenses r WHERE r.title = '10% sur Rayon Bio' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-003');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-004', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 12 DAY), NULL, DATE_SUB(NOW(), INTERVAL 7 DAY)
FROM recompenses r WHERE r.title = '20% sur Livres d''Occasion' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-004');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-005', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 8 DAY), NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM recompenses r WHERE r.title = 'Smoothie Detox Gratuit' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-005');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-006', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 5 DAY), NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM recompenses r WHERE r.title = 'Révision Complète Gratuite' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-006');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-007', r.points_necessaires, 'UTILISE', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)
FROM recompenses r WHERE r.title = 'Panier de Légumes Bio' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-007');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-008', r.points_necessaires, 'UTILISE', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)
FROM recompenses r WHERE r.title = 'Menu Déjeuner Bio Complet' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-008');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-009', 80, 'EXPIRE', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, DATE_SUB(NOW(), INTERVAL 45 DAY)
FROM recompenses r WHERE r.title = 'Bon d''achat Papeterie 100 DH' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-009');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-010', 150, 'EXPIRE', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 60 DAY)
FROM recompenses r WHERE r.title = '20% sur Collection Join Life' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-010');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-011', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 22 DAY), NULL, DATE_SUB(NOW(), INTERVAL 6 DAY)
FROM recompenses r WHERE r.title = '25% sur Menu du Jour' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-011');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-012', r.points_necessaires, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 18 DAY), NULL, DATE_SUB(NOW(), INTERVAL 9 DAY)
FROM recompenses r WHERE r.title = '30% sur Soins Visage' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-012');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-013', 180, 'DISTRIBUE', DATE_ADD(NOW(), INTERVAL 14 DAY), NULL, DATE_SUB(NOW(), INTERVAL 11 DAY)
FROM recompenses r WHERE r.title = 'Location Vélo Électrique 3 Jours' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-013');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-014', r.points_necessaires, 'UTILISE', DATE_ADD(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)
FROM recompenses r WHERE r.title = 'Dîner Gastronomique 2 Personnes' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-014');
INSERT INTO coupons (user_id, recompense_id, code, points_utilises, status, expire_le, valide_le, created_at)
SELECT 1, r.id, 'ECO-SANAE-015', 55, 'EXPIRE', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, DATE_SUB(NOW(), INTERVAL 50 DAY)
FROM recompenses r WHERE r.title = 'Atelier Compost Maison' AND NOT EXISTS (SELECT 1 FROM coupons c WHERE c.code = 'ECO-SANAE-015');

INSERT INTO commissions (partenaire_id, coupon_id, valeur_dh, montant_commission, taux_commission, mois_facturation, created_at)
SELECT p.id, c.id, 120.00, 8.40, 7.0, DATE_FORMAT(NOW(), '%Y-%m'), NOW()
FROM coupons c JOIN recompenses r ON c.recompense_id = r.id JOIN partenaires p ON r.partenaire_id = p.id
WHERE c.code = 'ECO-SANAE-007' AND NOT EXISTS (SELECT 1 FROM commissions x WHERE x.coupon_id = c.id);

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Sarah M.', 5, 'Excellente expérience au Café Botanique ! Cuisine délicieuse et cadre apaisant.', NOW()
FROM partenaires p WHERE p.user_id = 101
  AND NOT EXISTS (SELECT 1 FROM avis_partenaire a WHERE a.partenaire_id = p.id AND a.author_name = 'Sarah M.');

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Ahmed K.', 4, 'Très bon rapport qualité-prix. Menu bio et savoureux. Je recommande !', NOW()
FROM partenaires p WHERE p.user_id = 101
  AND NOT EXISTS (SELECT 1 FROM avis_partenaire a WHERE a.partenaire_id = p.id AND a.author_name = 'Ahmed K.');

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Leïla B.', 5, 'Collection Join Life de Zara : vêtements éco-responsables et tendance.', NOW()
FROM partenaires p WHERE p.user_id = 102
  AND NOT EXISTS (SELECT 1 FROM avis_partenaire a WHERE a.partenaire_id = p.id AND a.author_name = 'Leïla B.');

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Youssef T.', 5, 'Dîner exceptionnel au Jardin Secret. Service impeccable à Rabat.', NOW()
FROM partenaires p WHERE p.user_id = 103
  AND NOT EXISTS (SELECT 1 FROM avis_partenaire a WHERE a.partenaire_id = p.id AND a.author_name = 'Youssef T.');

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Fatima Z.', 4, 'Super concept de vélo électrique ! Location facile à Marrakech.', NOW()
FROM partenaires p WHERE p.user_id = 105
  AND NOT EXISTS (SELECT 1 FROM avis_partenaire a WHERE a.partenaire_id = p.id AND a.author_name = 'Fatima Z.');

INSERT INTO avis_partenaire (partenaire_id, author_name, rating, comment, created_at)
SELECT p.id, 'Nadia R.', 5, 'Massage incroyable ! Produits naturels et ambiance zen.', NOW()
FROM partenaires p WHERE p.user_id = 106
  AND NOT EXISTS (SELECT 1 FROM avis_partenaire a WHERE a.partenaire_id = p.id AND a.author_name = 'Nadia R.');


-- ─────────────────────────────────────────────────────────────
-- 6) db_admin  (mysql-admin, port 3312)
-- ─────────────────────────────────────────────────────────────
USE db_admin;

INSERT INTO categories (nom, description, image_url, published, created_at, updated_at) VALUES
('Compostage', 'Reboisement et espaces verts', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop', 1, NOW(), NOW()),
('Nettoyage', 'Actions de collecte', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b150?w=800&h=600&fit=crop', 1, NOW(), NOW()),
('Reboisement', 'Protection faune et flore', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop', 1, NOW(), NOW()),
('Recyclage', 'Tri et économie circulaire', 'https://images.unsplash.com/photo-1611288588316-0d9c9c4d2c5e?w=800&h=600&fit=crop', 1, NOW(), NOW()),
('Sensibilisation', 'Ateliers et conférences', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE description = VALUES(description), image_url = VALUES(image_url), published = VALUES(published), updated_at = NOW();

INSERT INTO actions_fixes (titre, description, categorie, est_fixe, association_id, association_name, points, active, created_at, updated_at)
SELECT * FROM (
  SELECT 'Nettoyage de plage type' AS titre, 'Modèle national plage' AS descr, 'Nettoyage' AS cat, 1 AS fixe,
    1 AS asso_id, 'Méditerranée Propre' AS asso_name, 50 AS pts, 1 AS act, NOW() AS ca, NOW() AS ua
  UNION ALL SELECT 'Reboisement urbain type', 'Modèle reboisement ville', 'Reboisement', 1, 1, 'Terre Bleue Maroc', 80, 1, NOW(), NOW()
  UNION ALL SELECT 'Atelier zéro déchet type', 'Modèle atelier', 'Sensibilisation', 1, NULL, NULL, 30, 1, NOW(), NOW()
) t
WHERE NOT EXISTS (SELECT 1 FROM actions_fixes f WHERE f.titre = t.titre);

INSERT INTO configurations (cle, valeur, description, updated_at) VALUES
('points.inscription.default', '10', 'Points bonus à l''inscription', NOW()),
('points.penalite.absence', '25', 'Pénalité absence non justifiée', NOW()),
('action.max.participants.default', '30', 'Capacité par défaut', NOW()),
('email.notifications.enabled', 'true', 'Notifications e-mail actives', NOW()),
('maintenance.mode', 'false', 'Mode maintenance', NOW())
ON DUPLICATE KEY UPDATE valeur = VALUES(valeur), updated_at = NOW();

INSERT INTO logs_admin (admin_id, action, cible_id, cible_type, created_at)
SELECT 1, 'VALIDATION_ASSOCIATION', 20, 'ASSOCIATION', DATE_SUB(NOW(), INTERVAL 10 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM logs_admin l WHERE l.action = 'VALIDATION_ASSOCIATION' AND l.cible_id = 20);

INSERT INTO logs_admin (admin_id, action, cible_id, cible_type, created_at)
SELECT 1, 'PUBLICATION_ACTION', 1, 'ACTION', DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM logs_admin l WHERE l.action = 'PUBLICATION_ACTION' AND l.cible_id = 1);

INSERT INTO logs_admin (admin_id, action, cible_id, cible_type, created_at)
SELECT 1, 'MODIFICATION_CONFIG', 1, 'CONFIG', DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM logs_admin l WHERE l.action = 'MODIFICATION_CONFIG' AND l.cible_id = 1);


-- ─────────────────────────────────────────────────────────────
-- 7) db_notification  (mysql-notification, port 3313)
-- ─────────────────────────────────────────────────────────────
USE db_notification;

INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(1, 'Bienvenue sur Ecopria', 'Votre compte citoyen est actif. Explorez les actions près de chez vous.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 'Inscription confirmée', 'Vous êtes inscrite à l''action Nettoyage plage Martil. Présentez votre QR le jour J.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 'Points gagnés', 'Bravo ! +70 points pour votre participation à une action écologique.', 'SUCCESS', 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'Nouvelle offre partenaire', 'Café Botanique propose -20 % sur le menu du jour (150 pts).', 'INFO', 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'Coupon généré', 'Votre coupon ECO-SANAE-001 est prêt. Valable 30 jours.', 'SUCCESS', 0, NOW()),
(20, 'Compte association validé', 'Votre association est visible sur la plateforme.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(101, 'Compte partenaire validé', 'Publiez vos premières offres dans votre espace partenaire.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 4 DAY));


-- ─────────────────────────────────────────────────────────────
-- FIN — Fichier unique : sections 0 → 7 (tous les services).
-- Coupons : user_id = auth_id du compte connecté (adapter si != 1).
-- =============================================================
