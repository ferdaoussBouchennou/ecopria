package com.example.auth_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaConfig {

    // Créer le topic "user.inscrit" s'il n'existe pas encore
    @Bean
    public NewTopic topicUserInscrit() {
        return new NewTopic("user.inscrit", 1, (short) 1);
    }

    @Bean
    public NewTopic topicEmailVerification() {
        return new NewTopic("email.verification", 3, (short) 1);
    }
}