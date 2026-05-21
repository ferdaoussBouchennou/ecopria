package com.ecopria.action.kafka;

import com.ecopria.action.service.ActionService;
import com.ecopria.action.service.AssociationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActionConsumer {

    private final ActionService actionService;
    private final AssociationService associationService;

    // ── écoute asso.validee pour créer l'association directement validée ──
    @KafkaListener(topics = "asso.validee", groupId = "service-action")
    public void onAssociationValidated(Map<String, Object> event) {
        log.info("Association validée reçue depuis admin, userId: {}", event.get("userId"));
        associationService.createValidatedFromKafkaEvent(event);
    }

    // ── écoute inscription.annulee pour libérer une place ─────
    @KafkaListener(topics = "inscription.annulee", groupId = "service-action")
    public void onInscriptionCancelled(Map<String, Object> event) {
        Long actionId = Long.valueOf(event.get("actionId").toString());
        log.info("Libération place pour actionId: {}", actionId);
        actionService.releasePlace(actionId);
    }

    // ── écoute inscription.confirmee pour décrémenter une place
    @KafkaListener(topics = "inscription.confirmee", groupId = "service-action")
    public void onInscriptionConfirmed(Map<String, Object> event) {
        Long actionId = Long.valueOf(event.get("actionId").toString());
        log.info("Décrémentation place pour actionId: {}", actionId);
        actionService.decrementPlace(actionId);
    }

    // ── écoute action.fixe.creee depuis service-admin ─────────
    @KafkaListener(topics = "action.fixe.creee", groupId = "service-action")
    public void onFixedActionCreated(Map<String, Object> event) {
        log.info("Action fixe reçue: {}", event.get("titre"));
        actionService.createFixedAction(event);
    }

    // ── écoute action.fixe.modifiee depuis service-admin ──────
    @KafkaListener(topics = "action.fixe.modifiee", groupId = "service-action")
    public void onFixedActionUpdated(Map<String, Object> event) {
        log.info("Modification action fixe: {}", event.get("actionFixeId"));
        actionService.updateFixedAction(event);
    }

    // ── écoute action.fixe.desactivee depuis service-admin ────
    @KafkaListener(topics = "action.fixe.desactivee", groupId = "service-action")
    public void onFixedActionDeactivated(Map<String, Object> event) {
        log.info("Désactivation action fixe: {}", event);
        actionService.deactivateFixedAction(event);
    }

    // ── SYNCHRONISATION CATÉGORIES ───────────────────────────

    @KafkaListener(topics = "categorie.creee", groupId = "service-action")
    public void onCategorieCreated(Map<String, Object> event) {
        log.info("Nouvelle catégorie reçue : {}", event.get("nom"));

        com.ecopria.action.model.Categorie cat = com.ecopria.action.model.Categorie.builder()
                .name(event.get("nom").toString())
                .description(event.get("description") != null ? event.get("description").toString() : null)
                .imageUrl(event.get("imageUrl") != null ? event.get("imageUrl").toString() : null)
                .build();

        actionService.saveCategorie(cat);
    }

    @KafkaListener(topics = "categorie.modifiee", groupId = "service-action")
    public void onCategorieUpdated(Map<String, Object> event) {
        String name = event.get("nom").toString();
        log.info("Modification catégorie : {}", name);

        actionService.updateCategorie(name, event);
    }
}