package com.ecopria.utilisateur.kafka;

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

    // Écoute topic 1 : user.inscrit → créer le profil
    @KafkaListener(topics = "user.inscrit", groupId = "utilisateur-group")
    public void onUserInscrit(Map<String, Object> event) {
        log.info("[Kafka] user.inscrit reçu : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());
        String lastName = event.get("lastName").toString();
        String firstName = event.get("firstName").toString();
        userService.createProfile(userId, lastName, firstName);
    }

    // Écoute topic 4 : presence.validee → créditer les points
    @KafkaListener(topics = "presence.validee", groupId = "utilisateur-group")
    public void onPresenceValidee(Map<String, Object> event) {
        log.info("Kafka] presence.validee reçu : {}", event);
        PointsDTO dto = new PointsDTO();
        dto.setUserId(Long.valueOf(event.get("userId").toString()));
        dto.setPoints(Integer.valueOf(event.get("points").toString()));
        dto.setActionId(Long.valueOf(event.get("actionId").toString()));
        dto.setSource("presence");
        userService.awardPoints(dto);
    }

    // Écoute topic 11 : recompense.echangee → débiter les points
    @KafkaListener(topics = "recompense.echangee", groupId = "utilisateur-group")
    public void onRecompenseEchangee(Map<String, Object> event) {
        log.info("[Kafka] recompense.echangee reçu : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());
        Integer points = Integer.valueOf(event.get("pointsUsed").toString());
        userService.deductPoints(userId, points);
    }
}