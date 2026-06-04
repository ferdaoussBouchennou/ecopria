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

    public void envoyerNotification(Inscription inscription,
                                    com.ecopria.inscription.dto.ActionDTO action,
                                    String email,
                                    String firstName) {
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
                action.getAssociationUserId(),
                action.getTitre(),
                action.getCity(),
                action.getAddress(),
                inscription.getStatut(),
                email,
                firstName,
                inscription.getPointsAction()
        );
        event.setEnAttenteMotif(inscription.getEnAttenteMotif());
        event.setActionTitle(action.getTitre());
        event.setTitle(action.getTitre());
        kafkaTemplate.send(TOPIC_CONFIRMEE, String.valueOf(inscription.getUserId()), event);
        System.out.println("Kafka [inscription.confirmee] publié pour inscriptionId=" + inscription.getId()
                + " statut=" + inscription.getStatut());
    }

    // Publié quand un utilisateur se désinscrit
    public void envoyerNotificationPromotion(Inscription inscription,
                                             com.ecopria.inscription.dto.ActionDTO action,
                                             String email,
                                             String firstName) {
        java.time.LocalDateTime dateStart = null;
        if (action.getDateStart() != null) {
            try {
                dateStart = java.time.LocalDateTime.parse(action.getDateStart());
            } catch (Exception ignored) {
            }
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
                action.getAssociationUserId(),
                action.getTitre(),
                action.getCity(),
                action.getAddress(),
                "CONFIRMEE",
                email,
                firstName,
                inscription.getPointsAction()
        );
        event.setPromotionFromWaitlist(true);
        event.setActionTitle(action.getTitre());
        kafkaTemplate.send(TOPIC_CONFIRMEE, String.valueOf(inscription.getUserId()), event);
    }

    public void envoyerAnnulation(Inscription inscription, String statutAvantAnnulation, String actionTitle) {
        InscriptionAnnuleeEvent event = new InscriptionAnnuleeEvent(
                inscription.getId(),
                inscription.getUserId(),
                inscription.getActionId(),
                statutAvantAnnulation,
                actionTitle
        );
        kafkaTemplate.send(TOPIC_ANNULEE, String.valueOf(inscription.getUserId()), event);
        System.out.println("Kafka [inscription.annulee] publié pour inscriptionId=" + inscription.getId());
    }
}