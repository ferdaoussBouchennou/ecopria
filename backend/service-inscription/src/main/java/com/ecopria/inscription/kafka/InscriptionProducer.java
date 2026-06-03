package com.ecopria.inscription.kafka;

import com.ecopria.inscription.model.Inscription;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class InscriptionProducer {

    private static final String TOPIC_CONFIRMEE = "inscription.confirmee";
    private static final String TOPIC_ANNULEE   = "inscription.annulee";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public InscriptionProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void envoyerConfirmation(Inscription inscription, com.ecopria.inscription.dto.ActionDTO action) {
        java.time.LocalDateTime dateStart = null;
        if (action.getDateStart() != null) {
            try {
                dateStart = java.time.LocalDateTime.parse(action.getDateStart());
            } catch (Exception e) {}
        }
        if (dateStart == null) {
            dateStart = inscription.getDateInscription();
        }

        InscriptionEvent event = new InscriptionEvent(
                inscription.getId(),
                inscription.getUserId(),
                inscription.getActionId(),
                dateStart,
                action.getAssociationId(),
                action.getTitre(),
                action.getCity(),
                action.getAddress()
        );
        kafkaTemplate.send(TOPIC_CONFIRMEE, String.valueOf(inscription.getUserId()), event);
        System.out.println("Kafka [inscription.confirmee] publié pour inscriptionId=" + inscription.getId());
    }

    // Publié quand un utilisateur se désinscrit
    public void envoyerAnnulation(Inscription inscription) {
        InscriptionAnnuleeEvent event = new InscriptionAnnuleeEvent(
                inscription.getId(),
                inscription.getUserId(),
                inscription.getActionId()
        );
        kafkaTemplate.send(TOPIC_ANNULEE, String.valueOf(inscription.getUserId()), event);
        System.out.println("Kafka [inscription.annulee] publié pour inscriptionId=" + inscription.getId());
    }
}