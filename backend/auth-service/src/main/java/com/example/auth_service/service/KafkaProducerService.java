package com.example.auth_service.service;

import com.example.auth_service.dto.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUserRegistered(UserRegisteredEvent event) {
        kafkaTemplate.send("citoyen.inscrit", String.valueOf(event.getUserId()), event);
        log.info("Published citoyen.inscrit for userId: {}", event.getUserId());
    }

    public void publishAssociationPending(UserRegisteredEvent event) {
        kafkaTemplate.send("asso.en_attente", String.valueOf(event.getUserId()), event);
        log.info("Published asso.en_attente for userId: {}", event.getUserId());
    }

    public void publishAssociationValidated(UserRegisteredEvent event) {
        kafkaTemplate.send("asso.valide", String.valueOf(event.getUserId()), event);
        log.info("Published asso.valide for userId: {}", event.getUserId());
    }
}