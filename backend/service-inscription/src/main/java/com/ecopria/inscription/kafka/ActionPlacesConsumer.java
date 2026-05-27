package com.ecopria.inscription.kafka;

import com.ecopria.inscription.model.Inscription;
import com.ecopria.inscription.repository.InscriptionRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActionPlacesConsumer {

    private final InscriptionRepository inscriptionRepository;
    private final InscriptionProducer inscriptionProducer;

    public ActionPlacesConsumer(InscriptionRepository inscriptionRepository,
                                InscriptionProducer inscriptionProducer) {
        this.inscriptionRepository = inscriptionRepository;
        this.inscriptionProducer = inscriptionProducer;
    }

    @KafkaListener(topics = "action.places.mises.a.jour", groupId = "service-inscription")
    @Transactional
    public void onPlacesMisesAJour(ActionPlacesEvent event) {
        System.out.println("Kafka reçu [action.places.mises.a.jour] actionId="
                + event.getActionId() + " places=" + event.getAvailablePlaces());

        Integer availablePlaces = event.getAvailablePlaces();
        if (availablePlaces == null || availablePlaces <= 0) {
            return;
        }

        List<Inscription> enAttente = inscriptionRepository
                .findByActionIdAndStatutOrderByDateInscriptionAsc(
                        event.getActionId(), "EN_ATTENTE"
                );

        int remaining = availablePlaces;
        for (Inscription inscription : enAttente) {
            if (remaining <= 0) {
                break;
            }
            inscription.setStatut("CONFIRMEE");
            inscriptionRepository.save(inscription);
            inscriptionProducer.envoyerConfirmation(inscription);
            remaining--;
            System.out.println("Liste d'attente : userId=" + inscription.getUserId()
                    + " promu CONFIRMEE pour actionId=" + event.getActionId());
        }
    }
}