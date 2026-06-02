package com.ecopria.utilisateur.kafka;

import com.ecopria.utilisateur.dto.AssociationDTO;
import com.ecopria.utilisateur.dto.CitizenDTO;
import com.ecopria.utilisateur.dto.PartnerDTO;
import com.ecopria.utilisateur.dto.PointsDTO;
import com.ecopria.utilisateur.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;

/**
 * Consommateurs Kafka du service profils / points.
 * Table des topics : fichier {@code docs/KAFKA_TOPICS.md} (racine du dépôt).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserConsumer {

    private final UserService userService;

    /**
     * Création profil citoyen — topics {@code citoyen.inscrit} et {@code user.inscrit} (alias côté auth).
     * Schéma : {@code userId} ou {@code auth_id}, prénom/nom en snake_case ou camelCase.
     */
    @KafkaListener(topics = { "citoyen.inscrit", "user.inscrit" }, groupId = "utilisateur-group")
    public void onCitoyenInscrit(Map<String, Object> event) {
        log.info("[Kafka] citoyen/user.inscrit reçu : {}", event);
        try {
            CitizenDTO dto = new CitizenDTO();
            dto.setAuthId(readLong(event, "auth_id", "userId"));
            dto.setLastName(readRequiredString(event, "last_name", "lastName"));
            dto.setFirstName(readRequiredString(event, "first_name", "firstName"));
            dto.setEmail(readOptionalString(event, "email"));
            dto.setPhone(readOptionalString(event, "phone"));
            dto.setAddress(readOptionalString(event, "address"));
            dto.setCity(readOptionalString(event, "city"));
            userService.syncCitizenFromKafka(dto);
        } catch (Exception e) {
            log.error("Erreur conversion CitizenDTO : {}", e.getMessage());
        }
    }

    @KafkaListener(topics = { "asso.validee", "asso.en_attente", "partenaire.validee" }, groupId = "utilisateur-group")
    public void onAssoOuPartenaireEvent(Map<String, Object> event) {
        log.info("[Kafka] event asso/partenaire reçu : {}", event);
        try {
            Long authId = readLong(event, "auth_id", "userId");
            String nom = readRequiredString(event, "name", "nom");
            String email = readOptionalString(event, "email");
            String role = readOptionalString(event, "role");

            if ("PARTNER".equalsIgnoreCase(role)) {
                PartnerDTO dto = new PartnerDTO();
                dto.setAuthId(authId);
                dto.setName(nom);
                dto.setEmail(email);
                dto.setCategory("Général"); // Default category
                userService.createPartner(dto);
            } else {
                AssociationDTO dto = new AssociationDTO();
                dto.setAuthId(authId);
                dto.setName(nom);
                dto.setEmail(email);
                userService.createAssociation(dto);
            }
        } catch (Exception e) {
            log.error("Erreur conversion event asso/partenaire : {}", e.getMessage());
        }
    }

    /** Événement émis par service-presence ({@link com.ecopria.presence.kafka.PresenceValideeEvent}) : userId, actionId, points. */
    @KafkaListener(topics = "presence.validee", groupId = "utilisateur-group")
    public void onPresenceValidee(Map<String, Object> event) {
        log.info("[Kafka] presence.validee reçu : {}", event);
        try {
            Long authId = readLong(event, "userId", "auth_id");
            Integer points = readInt(event, "points");
            Long actionId = readLong(event, "actionId", "action_id");

            PointsDTO dto = new PointsDTO();
            dto.setAuthId(authId);
            dto.setPoints(points);
            dto.setActionId(actionId);
            dto.setSource("presence");
            userService.awardPoints(dto);
        } catch (Exception e) {
            log.error("Erreur conversion PointsDTO (presence.validee) : {}", e.getMessage());
        }
    }

    /** Événement {@code RecompenseEchangeeEvent} : userId, pointsUtilises. */
    @KafkaListener(topics = "recompense.echangee", groupId = "utilisateur-group")
    public void onRecompenseEchangee(Map<String, Object> event) {
        log.info("[Kafka] recompense.echangee reçu : {}", event);
        try {
            Long authId = readLong(event, "userId", "auth_id");
            Integer points = readInt(event, "pointsUtilises", "points_used");
            userService.deductPoints(authId, points);
        } catch (Exception e) {
            log.error("Erreur conversion debit points (recompense.echangee) : {}", e.getMessage());
        }
    }

    private Long readLong(Map<String, Object> event, String... keys) {
        Object value = readRawRequired(event, keys);
        if (value instanceof Number n) return n.longValue();
        return Long.valueOf(value.toString());
    }

    private Integer readInt(Map<String, Object> event, String... keys) {
        Object value = readRawRequired(event, keys);
        if (value instanceof Number n) return n.intValue();
        return Integer.valueOf(value.toString());
    }

    private String readRequiredString(Map<String, Object> event, String... keys) {
        Object value = readRawRequired(event, keys);
        String str = value.toString().trim();
        if (str.isEmpty()) {
            throw new IllegalArgumentException("Champ vide: " + String.join("/", keys));
        }
        return str;
    }

    private String readOptionalString(Map<String, Object> event, String... keys) {
        for (String key : keys) {
            Object value = event.get(key);
            if (value == null) {
                continue;
            }
            String str = value.toString().trim();
            return str.isEmpty() ? null : str;
        }
        return null;
    }

    private Object readRawRequired(Map<String, Object> event, String... keys) {
        for (String key : keys) {
            Object value = event.get(key);
            if (value != null) {
                return value;
            }
        }
        throw new IllegalArgumentException("Champ manquant: " + String.join("/", keys));
    }
}