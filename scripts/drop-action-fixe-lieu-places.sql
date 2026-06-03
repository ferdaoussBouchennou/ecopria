-- Run on db_admin (phpMyAdmin → mysql-admin, port 3312)
-- Removes lieu/places/geo columns from fixed-action templates only (actions_fixes table).

USE db_admin;

ALTER TABLE actions_fixes
  DROP COLUMN IF EXISTS lieu,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS places_total;
