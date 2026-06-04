package com.ecopria.inscription.kafka;

import com.ecopria.inscription.client.UtilisateurClient;
import com.ecopria.inscription.model.Inscription;
import com.ecopria.inscription.repository.InscriptionRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ActionPlacesConsumer {

    private static final int TRUST_SCORE_SEUIL = 70;

    private final InscriptionRepository inscriptionRepository;
    private final InscriptionProducer inscriptionProducer;
    private final com.ecopria.inscription.client.ActionClient actionClient;
    private final UtilisateurClient utilisateurClient;

    public ActionPlacesConsumer(InscriptionRepository inscriptionRepository,
                                InscriptionProducer inscriptionProducer,
                                com.ecopria.inscription.client.ActionClient actionClient,
                                UtilisateurClient utilisateurClient) {
        this.inscriptionRepository = inscriptionRepository;
        this.inscriptionProducer = inscriptionProducer;
        this.actionClient = actionClient;
        this.utilisateurClient = utilisateurClient;
    }

    @KafkaListener(topics = "action.places.mises.a.jour", groupId = "service-inscription")
    @Transactional
    public void onPlacesMisesAJour(Map<String, Object> event) {
        Long actionId = readLong(event, "actionId", "action_id");
        Integer availablePlaces = readInt(event, "availablePlaces", "available_places");
        if (actionId == null) {
            return;
        }
        System.out.println("Kafka reçu [action.places.mises.a.jour] actionId="
                + actionId + " places=" + availablePlaces);

        if (availablePlaces == null || availablePlaces <= 0) {
            return;
        }

        List<Inscription> enAttente = inscriptionRepository
                .findByActionIdAndStatutOrderByDateInscriptionAsc(actionId, "EN_ATTENTE");

        if (enAttente.isEmpty()) return;
        
        com.ecopria.inscription.dto.ActionDTO action = actionClient.getAction(actionId);
        
        int remaining = availablePlaces;
        for (Inscription inscription : enAttente) {
            if (remaining <= 0) {
                break;
            }
            // Liste d'attente « confiance » : ne promouvoir que si le score est redevenu >= seuil
            if (Inscription.MOTIF_TRUST.equals(inscription.getEnAttenteMotif())) {
                int trust = utilisateurClient.getTrustScore(inscription.getUserId());
                if (trust < TRUST_SCORE_SEUIL) {
                    continue;
                }
            }
            inscription.setStatut("CONFIRMEE");
            inscription.setEnAttenteMotif(null);
            inscriptionRepository.save(inscription);
            // L'e-mail est envoyé via le profil utilisateur (service-utilisateur)
            inscriptionProducer.envoyerNotificationPromotion(
                    inscription,
                    action,
                    inscription.getParticipantEmail(),
                    inscription.getParticipantFirstName());
            remaining--;
            System.out.println("Liste d'attente : userId=" + inscription.getUserId()
                    + " promu CONFIRMEE pour actionId=" + actionId);
        }
    }

    private static Long readLong(Map<String, Object> event, String... keys) {
        for (String key : keys) {
            Object v = event.get(key);
            if (v instanceof Number n) {
                return n.longValue();
            }
            if (v != null) {
                return Long.parseLong(v.toString());
            }
        }
        return null;
    }

    private static Integer readInt(Map<String, Object> event, String... keys) {
        for (String key : keys) {
            Object v = event.get(key);
            if (v instanceof Number n) {
                return n.intValue();
            }
            if (v != null) {
                return Integer.parseInt(v.toString());
            }
        }
        return null;
    }
}