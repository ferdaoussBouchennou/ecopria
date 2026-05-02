package com.example.admin_service.kafka.producer;


import com.example.admin_service.kafka.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishActionFixeCreee(ActionFixeEvent event) {
        kafkaTemplate.send("action.fixe.creee",
                String.valueOf(event.getActionFixeId()), event);
    }

    public void publishActionFixeModifiee(ActionFixeEvent event) {
        kafkaTemplate.send("action.fixe.modifiee",
                String.valueOf(event.getActionFixeId()), event);
    }

    public void publishActionFixeDesactivee(ActionFixeEvent event) {
        kafkaTemplate.send("action.fixe.desactivee",
                String.valueOf(event.getActionFixeId()), event);
    }

    public void publishCategorieCreee(CategorieEvent event) {
        kafkaTemplate.send("categorie.creee", event.getNom(), event);
    }

    public void publishCategorieModifiee(CategorieEvent event) {
        kafkaTemplate.send("categorie.modifiee", event.getNom(), event);
    }

    public void publishStatutChange(StatutChangeEvent event) {
        String topic = switch (event.getType()) {
            case "USER" -> "user.statut.change";
            case "ASSOCIATION" -> "association.statut.change";
            case "PARTENAIRE" -> "partenaire.statut.change";
            default -> throw new RuntimeException("Unknown type: " + event.getType());
        };
        kafkaTemplate.send(topic, String.valueOf(event.getUserId()), event);
    }

    public void publishPartenaireValidee(Object eventPayload, String key) {
        kafkaTemplate.send("partenaire.validee", key, eventPayload);
    }

    public void publishAssoValidee(Object eventPayload, String key) {
        kafkaTemplate.send("asso.validee", key, eventPayload);
    }

    public void publishActionAdminEvent(String topic, String key, Object eventPayload) {
        kafkaTemplate.send(topic, key, eventPayload);
    }
}
