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

@Slf4j
@Component
@RequiredArgsConstructor
public class UserConsumer {

    private final UserService userService;

    // Écoute topic citoyen.inscrit → créer le profil citoyen
    @KafkaListener(topics = "citoyen.inscrit", groupId = "utilisateur-group")
    public void onCitoyenInscrit(Map<String, Object> event) {
        log.info("[Kafka] citoyen.inscrit reçu : {}", event);
        try {
            // Payload minimal attendu depuis auth: auth_id + first_name/last_name (+ email optionnel)
            CitizenDTO dto = new CitizenDTO();
            dto.setAuthId(readLong(event, "auth_id"));
            dto.setLastName(readRequiredString(event, "last_name"));
            dto.setFirstName(readRequiredString(event, "first_name"));
            // Les infos de profil (phone/address/city/photo) sont renseignées plus tard dans l'espace profil.
            dto.setEmail(readOptionalString(event, "email"));
            userService.createCitizen(dto);
        } catch (Exception e) {
            log.error("Erreur conversion CitizenDTO : {}", e.getMessage());
        }
    }

    // Écoute topic asso.validee → créer le profil association
    @KafkaListener(topics = "asso.validee", groupId = "utilisateur-group")
    public void onAssoValidee(Map<String, Object> event) {
        log.info("[Kafka] asso.validee reçu : {}", event);
        try {
            AssociationDTO dto = new AssociationDTO();
            dto.setAuthId(readLong(event, "auth_id"));
            dto.setName(readRequiredString(event, "name"));
            dto.setEmail(readOptionalString(event, "email"));
            userService.createAssociation(dto);
        } catch (Exception e) {
            log.error("Erreur conversion AssociationDTO : {}", e.getMessage());
        }
    }

    // Écoute topic partenaire.validee → créer le profil partenaire
    @KafkaListener(topics = "partenaire.validee", groupId = "utilisateur-group")
    public void onPartenaireValidee(Map<String, Object> event) {
        log.info("[Kafka] partenaire.validee reçu : {}", event);
        try {
            PartnerDTO dto = new PartnerDTO();
            dto.setAuthId(readLong(event, "auth_id"));
            dto.setName(readRequiredString(event, "name"));
            dto.setEmail(readOptionalString(event, "email"));
            userService.createPartner(dto);
        } catch (Exception e) {
            log.error("Erreur conversion PartnerDTO : {}", e.getMessage());
        }
    }

    // Écoute topic 4 : presence.validee → créditer les points
    @KafkaListener(topics = "presence.validee", groupId = "utilisateur-group")
    public void onPresenceValidee(Map<String, Object> event) {
        log.info("[Kafka] presence.validee reçu : {}", event);
        try {
            Long authId = readLong(event, "auth_id");
            Integer points = readInt(event, "points");
            Long actionId = readLong(event, "action_id");

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

    // Écoute topic 11 : recompense.echangee → débiter les points
    @KafkaListener(topics = "recompense.echangee", groupId = "utilisateur-group")
    public void onRecompenseEchangee(Map<String, Object> event) {
        log.info("[Kafka] recompense.echangee reçu : {}", event);
        try {
            Long authId = readLong(event, "auth_id");
            Integer points = readInt(event, "points_used");
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