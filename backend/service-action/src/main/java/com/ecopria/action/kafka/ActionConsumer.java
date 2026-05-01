package com.ecopria.action.kafka;

import com.ecopria.action.model.Categorie;
import com.ecopria.action.repository.CategorieRepository;
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
    private final CategorieRepository categorieRepository;

    // ── écoute user.inscrit pour créer l'association ──────────
    @KafkaListener(topics = "user.inscrit", groupId = "service-action")
    public void onUserRegistered(Map<String, Object> event) {
        String role = (String) event.get("role");
        if ("ASSOCIATION".equals(role)) {
            log.info("Nouvelle association reçue userId: {}", event.get("userId"));
            associationService.createFromKafkaEvent(event);
        }
    }

    // ── écoute compte.valide pour valider l'association ───────
    @KafkaListener(topics = "compte.valide", groupId = "service-action")
    public void onAccountValidated(Map<String, Object> event) {
        String type = (String) event.get("type");
        if ("ASSOCIATION".equals(type)) {
            Long userId = Long.valueOf(event.get("userId").toString());
            log.info("Validation association userId: {}", userId);
            associationService.validateByUserId(userId);
        }
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

        Categorie cat = Categorie.builder()
                .name(event.get("nom").toString())
                .description(event.get("description") != null ? event.get("description").toString() : null)
                .imageUrl(event.get("imageUrl") != null ? event.get("imageUrl").toString() : null)
                .build();

        categorieRepository.save(cat);
    }

    @KafkaListener(topics = "categorie.modifiee", groupId = "service-action")
    public void onCategorieUpdated(Map<String, Object> event) {
        String name = event.get("nom").toString();
        log.info("Modification catégorie : {}", name);

        categorieRepository.findByName(name).ifPresent(cat -> {
            if (event.containsKey("description"))
                cat.setDescription(event.get("description").toString());
            if (event.containsKey("imageUrl"))
                cat.setImageUrl(event.get("imageUrl").toString());
            categorieRepository.save(cat);
        });
    }

    @KafkaListener(topics = "categorie.desactivee", groupId = "service-action")
    public void onCategorieDeleted(Map<String, Object> event) {
        String name = event.get("nom").toString();
        log.info("Desactivation catégorie : {}", name);
        categorieRepository.findByName(name).ifPresent(categorieRepository::delete);
    }
}