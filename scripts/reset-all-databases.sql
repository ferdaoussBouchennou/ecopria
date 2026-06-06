-- Ecopria — Vider toutes les tables (une base à la fois via docker exec)
-- Usage : voir reset-and-seed-all.ps1

SET FOREIGN_KEY_CHECKS = 0;

SET @tables = NULL;
SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') SEPARATOR ', ')
INTO @tables
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE';

SET @sql = IF(@tables IS NULL, 'SELECT 1', CONCAT('TRUNCATE TABLE ', @tables));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
