package com.ecopria.inscription.kafka;

import com.ecopria.inscription.service.InscriptionService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Lorsqu'une action est annulée, marque toutes les inscriptions actives comme ANNULEE
 * (sans publier inscription.annulee — la notification est gérée par service-notification).
 */
@Service
public class ActionAnnuleeConsumer {

    private final InscriptionService inscriptionService;

    public ActionAnnuleeConsumer(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @KafkaListener(topics = "action.annulee", groupId = "service-inscription-action-annulee")
    public void onActionAnnulee(Map<String, Object> event) {
        Object actionIdObj = event.get("actionId");
        if (actionIdObj == null) {
            actionIdObj = event.get("action_id");
        }
        if (actionIdObj == null) {
            return;
        }
        Long actionId = actionIdObj instanceof Number n ? n.longValue() : Long.parseLong(actionIdObj.toString());
        int count = inscriptionService.annulerInscriptionsPourAction(actionId);
        System.out.println("[action.annulee] actionId=" + actionId + " — " + count + " inscription(s) annulée(s)");
    }
}
