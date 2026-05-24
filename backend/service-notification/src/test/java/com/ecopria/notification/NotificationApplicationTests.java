package com.ecopria.notification;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test de démarrage du contexte Spring Boot en mode test.
 * - Profil "test" → application-test.yaml (MySQL localhost, Kafka désactivé)
 * - KafkaAutoConfiguration exclu : pas besoin d'un broker réel en CI
 * - ecopria.mail.enforce=false → spring.mail.username vide toléré
 */
@SpringBootTest
@ActiveProfiles("test")
class NotificationApplicationTests {

    @Test
    void contextLoads() {
        // Vérifie que le contexte Spring Boot démarre sans erreur
    }
}
