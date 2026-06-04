package com.ecopria.inscription.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Supprime la colonne obsolète {@code accompagnants} si elle existe encore en base
 * (retirée du modèle JPA mais parfois conservée par ddl-auto: update).
 */
@Component
public class InscriptionSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InscriptionSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public InscriptionSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'inscriptions'
                      AND COLUMN_NAME = 'accompagnants'
                    """,
                    Integer.class);
            if (count != null && count > 0) {
                jdbcTemplate.execute("ALTER TABLE inscriptions DROP COLUMN accompagnants");
                log.info("Colonne inscriptions.accompagnants supprimée (obsolète).");
            }
        } catch (Exception e) {
            log.warn("Migration accompagnants ignorée : {}", e.getMessage());
        }
    }
}
