-- =============================================================
-- Données de développement Ecopria - db_action
-- À exécuter dans phpMyAdmin sur mysql-action (port 3308)
-- ou : mysql -h 127.0.0.1 -P 3308 -u ecopria -p db_action < dev-data-action.sql
-- =============================================================

USE db_action;

-- Association test (user_id = 1)
INSERT INTO associations (user_id, name, description, logo_url, city, is_validated, created_at, updated_at)
VALUES (
  1,
  'Méditerranée Propre',
  'Association de protection de l''environnement en Méditerranée.',
  NULL,
  'Marseille',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  city = VALUES(city),
  is_validated = VALUES(is_validated);

-- Exemple : publier une action existante (adapter l'id si besoin)
-- UPDATE actions SET status = 'PUBLISHED', association_id = (SELECT id FROM associations WHERE user_id = 1 LIMIT 1) WHERE id = 1;
