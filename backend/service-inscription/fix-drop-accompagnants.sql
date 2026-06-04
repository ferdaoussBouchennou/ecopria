-- À exécuter sur db_inscription si l'erreur « accompagnants doesn't have a default value » persiste
-- (sinon le service supprime la colonne au démarrage via InscriptionSchemaMigration)

USE db_inscription;
ALTER TABLE inscriptions DROP COLUMN accompagnants;
