-- =============================================================
-- Données de développement Ecopria - db_utilisateur
-- À exécuter dans phpMyAdmin sur mysql-utilisateur (port 3307)
-- ou : mysql -h 127.0.0.1 -P 3307 -u ecopria -p db_utilisateur < dev-data-utilisateur.sql
-- =============================================================

USE db_utilisateur;

-- Association test (auth_id = 1)
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

-- Citoyen test (auth_id = 2)
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
