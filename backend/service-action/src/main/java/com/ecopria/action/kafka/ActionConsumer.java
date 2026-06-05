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
        Long actionId = readLong(event, "actionId");
        if (actionId == null) {
            return;
        }
        String statut = readString(event, "statut");
        if (!"CONFIRMEE".equalsIgnoreCase(statut)) {
            log.info("Annulation sans libération de place (statut={}) actionId={}", statut, actionId);
            return;
        }
        log.info("Libération place pour actionId: {}", actionId);
        actionService.releasePlace(actionId);
    }

    /** Notifications + décrément places uniquement si inscription CONFIRMEE. */
    @KafkaListener(topics = "inscription.confirmee", groupId = "service-action")
    public void onInscriptionConfirmed(Map<String, Object> event) {
        Long actionId = readLong(event, "actionId");
        if (actionId == null) {
            return;
        }
        String statut = readString(event, "statut");
        if (!"CONFIRMEE".equalsIgnoreCase(statut)) {
            log.info("Inscription enregistrée sans décrément (statut={}) actionId={}", statut, actionId);
            return;
        }
        log.info("Décrémentation place pour actionId: {}", actionId);
        actionService.decrementPlace(actionId);
    }

    private static Long readLong(Map<String, Object> event, String key) {
        Object v = event.get(key);
        if (v == null) {
            v = event.get("action_id");
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        if (v != null) {
            return Long.valueOf(v.toString());
        }
        return null;
    }

    private static String readString(Map<String, Object> event, String key) {
        Object v = event.get(key);
        return v == null ? "" : v.toString().trim();
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

    @KafkaListener(topics = "action.fixe.activee", groupId = "service-action")
    public void onFixedActionActivated(Map<String, Object> event) {
        log.info("Réactivation action fixe: {}", event);
        actionService.activateFixedAction(event);
    }

    // ── SYNCHRONISATION CATÉGORIES ───────────────────────────

    @KafkaListener(topics = "categorie.creee", groupId = "service-action")
    public void onCategorieCreated(Map<String, Object> event) {
        log.info("Nouvelle catégorie reçue : {}", event.get("nom"));

        boolean published = event.get("published") == null
                || Boolean.parseBoolean(event.get("published").toString());

        actionService.ensureCategoryExists(
                event.get("nom").toString(),
                event.get("description") != null ? event.get("description").toString() : null,
                event.get("imageUrl") != null ? event.get("imageUrl").toString() : null,
                published
        );
    }

    @KafkaListener(topics = "categorie.modifiee", groupId = "service-action")
    public void onCategorieUpdated(Map<String, Object> event) {
        log.info("Modification catégorie (Kafka) : {}", event.get("nom"));
        actionService.updateCategorie(
                event.get("nom") != null ? event.get("nom").toString() : "",
                event
        );
    }
}