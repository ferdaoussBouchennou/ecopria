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
                + event.getActionId() + " places=" + event.getPlacesDisponibles());

        // S'il y a au moins une place qui vient de se libérer
        if (event.getPlacesDisponibles() > 0) {
            // Cherche la première personne EN_ATTENTE pour cette action (par ordre d'inscription)
            List<Inscription> enAttente = inscriptionRepository
                    .findByActionIdAndStatutOrderByDateInscriptionAsc(
                            event.getActionId(), "EN_ATTENTE"
                    );

            if (!enAttente.isEmpty()) {
                Inscription premiere = enAttente.get(0);
                premiere.setStatut("CONFIRMEE");
                inscriptionRepository.save(premiere);

                // Publie inscription.confirmee → Sanae lui envoie le QR Code par email
                inscriptionProducer.envoyerConfirmation(premiere);

                System.out.println("Liste d'attente : userId=" + premiere.getUserId()
                        + " promu CONFIRMEE pour actionId=" + event.getActionId());
            }
        }
    }
}