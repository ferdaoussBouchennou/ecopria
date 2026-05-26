-- =============================================================
-- Données de développement Ecopria
-- À exécuter dans phpMyAdmin (http://localhost:8888) ou mysql CLI
-- Après : docker compose -f docker-compose.infra.yml up -d
-- =============================================================

-- ── db_utilisateur : profil association (auth_id = 1) ─────────
USE db_utilisateur;

INSERT INTO associations (auth_id, name, email, phone, address, description, logo, city, created_at)
VALUES (
  1,
  'Méditerranée Propre',
  'contact@mediterranee-propre.fr',
  '0612345678',
  '12 quai du Port',
  'Association de protection de l''environnement en Méditerranée.',
  NULL,
  'Marseille',
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  city = VALUES(city);

-- Citoyen test (auth_id = 2) pour inscriptions / mes-inscriptions
INSERT INTO citizens (auth_id, first_name, last_name, email, phone, address, city, total_points, created_at)
VALUES (
  2,
  'Marie',
  'Martin',
  'marie.martin@example.com',
  '0698765432',
  '5 rue de la Plage',
  'Marseille',
  120,
  NOW()
)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name);

-- ── db_action : lien association ↔ actions (user_id = 1) ─────
USE db_action;

INSERT INTO associations (user_id, name, description, logo_url, city, created_at, updated_at)
VALUES (
  1,
  'Méditerranée Propre',
  'Association de protection de l''environnement en Méditerranée.',
  NULL,
  'Marseille',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  city = VALUES(city);

-- Exemple : publier une action existante (adapter l'id si besoin)
-- UPDATE actions SET status = 'PUBLISHED', association_id = (SELECT id FROM associations WHERE user_id = 1 LIMIT 1) WHERE id = 1;
