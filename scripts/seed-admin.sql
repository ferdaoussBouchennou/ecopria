-- Admin par défaut (mot de passe : Admin123!)
-- Exécuter via phpMyAdmin ou :
--   Get-Content scripts/seed-admin.sql | docker exec -i mysql-auth mysql -uecopria -pecopria_pass_2026

USE db_auth;

INSERT INTO users (email, password, role, is_active, is_verified, created_at)
VALUES (
  'admin@ecopria.local',
  '$2a$10$uPXNpUOU2bjTTnbVz0KA1eSrj9X8oS4gh.ubvs37jA0Nr4PtA5pH.',
  'ADMIN',
  1,
  1,
  NOW()
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = 'ADMIN',
  is_active = 1,
  is_verified = 1;
