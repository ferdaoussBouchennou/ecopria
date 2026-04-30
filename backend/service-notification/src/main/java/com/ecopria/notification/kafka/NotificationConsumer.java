package com.ecopria.notification.kafka;

import com.ecopria.notification.model.Notification;
import com.ecopria.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;

    private Long requireUserId(Map<String, Object> event, String topic) {
        Object userIdObj = event.getOrDefault("userId", event.get("id"));
        if (userIdObj == null) {
            log.error("{} sans userId: {}", topic, event);
            return null;
        }
        return Long.valueOf(userIdObj.toString());
    }

    private String readString(Map<String, Object> event, String field, String fallback) {
        Object value = event.get(field);
        return value == null ? fallback : value.toString();
    }

    @KafkaListener(topics = "user.inscrit", groupId = "notification-group")
    public void onUserInscrit(Map<String, Object> event) {
        log.info("📥 [Kafka] user.inscrit : {}", event);

        Long userId = requireUserId(event, "user.inscrit");
        if (userId == null) {
            return;
        }

        String firstName = readString(event, "firstName", "");

        notificationService.create(userId,
            "Bienvenue sur EcoPria 🌿",
            "Votre compte a ete cree. Rejoignez votre premiere action ecologique !",
            Notification.NotificationType.SUCCESS
        );

        if (event.containsKey("email")) {
            String email = event.get("email").toString();
            notificationService.sendEmail(email,
                "Bienvenue sur EcoPria 🌿",
                "Bonjour " + firstName + ",\n\n" +
                "Bienvenue sur EcoPria ! Votre compte est pret.\n\n" +
                "Commencez par explorer les actions pres de chez vous et gagnez vos premiers points.\n\n" +
                "- L'equipe EcoPria\n" +
                "https://ecopria.ma"
            );
        }
    }

    @KafkaListener(topics = "inscription.confirmee", groupId = "notification-group")
    public void onInscriptionConfirmee(Map<String, Object> event) {
        log.info("📥 [Kafka] inscription.confirmee : {}", event);
        Long userId = requireUserId(event, "inscription.confirmee");
        if (userId == null) {
            return;
        }

        String dateAction = readString(event, "dateAction", "");
        String actionTitle = readString(event, "actionTitle", "l'action");

        notificationService.create(userId,
            "Inscription confirmee ✅",
            "Votre inscription a ete confirmee pour : " + actionTitle + ". Votre QR Code sera envoye par email.",
            Notification.NotificationType.SUCCESS
        );

        if (event.containsKey("email")) {
            String email = event.get("email").toString();
            notificationService.sendEmail(email,
                "Votre inscription est confirmee - " + actionTitle,
                "Bonjour,\n\n" +
                "Votre inscription pour \"" + actionTitle + "\" est confirmee.\n" +
                "Date : " + dateAction + "\n\n" +
                "Votre QR code personnel sera genere et envoye avant l'evenement.\n\n" +
                "Vous pouvez le consulter ici : https://ecopria.ma/espace/qr\n\n" +
                "A tres bientot !\n" +
                "- L'equipe EcoPria"
            );
        }
    }

    @KafkaListener(topics = "inscription.annulee", groupId = "notification-group")
    public void onInscriptionAnnulee(Map<String, Object> event) {
        log.info("📥 [Kafka] inscription.annulee : {}", event);
        Long userId = requireUserId(event, "inscription.annulee");
        if (userId == null) {
            return;
        }
        String actionTitle = readString(event, "actionTitle", "l'action");

        notificationService.create(userId,
            "Desinscription enregistree",
            "Votre desinscription a ete prise en compte pour : " + actionTitle,
            Notification.NotificationType.INFO
        );
    }

    @KafkaListener(topics = "presence.validee", groupId = "notification-group")
    public void onPresenceValidee(Map<String, Object> event) {
        log.info("📥 [Kafka] presence.validee : {}", event);
        Long userId = requireUserId(event, "presence.validee");
        if (userId == null) {
            return;
        }
        String points = readString(event, "points", "0");

        notificationService.create(userId,
            "Presence validee 🎉",
            "Felicitations ! +" + points + " points ont ete credites sur votre compte.",
            Notification.NotificationType.SUCCESS
        );

        if (event.containsKey("email")) {
            String email = event.get("email").toString();
            notificationService.sendEmail(email,
                "+" + points + " points credites sur votre compte EcoPria",
                "Bonjour,\n\n" +
                "Votre presence a ete validee.\n" +
                points + " points ont ete credites sur votre compte.\n\n" +
                "Consultez votre solde : https://ecopria.ma/espace\n\n" +
                "Merci pour votre engagement !\n" +
                "- L'equipe EcoPria"
            );
        }
    }

    @KafkaListener(topics = "fraude.detectee", groupId = "notification-group")
    public void onFraudeDetectee(Map<String, Object> event) {
        log.warn("🚨 [Kafka] fraude.detectee : {}", event);
        notificationService.create(1L,
            "🚨 Fraude detectee",
            "Utilisateur #" + event.get("userId") + " - Raison : " + event.get("raison"),
            Notification.NotificationType.ALERT
        );
    }

    @KafkaListener(topics = "action.creee", groupId = "notification-group")
    public void onActionCreee(Map<String, Object> event) {
        log.info("📥 [Kafka] action.creee : {}", event.get("titre"));
    }

    @KafkaListener(topics = "action.annulee", groupId = "notification-group")
    public void onActionAnnulee(Map<String, Object> event) {
        log.info("📥 [Kafka] action.annulee : {}", event.get("titre"));
    }

    @KafkaListener(topics = "points.credites", groupId = "notification-group")
    public void onPointsCredites(Map<String, Object> event) {
        log.info("📥 [Kafka] points.credites : {}", event);
        Long userId = requireUserId(event, "points.credites");
        if (userId == null) {
            return;
        }
        String total = readString(event, "totalPoints", "0");

        notificationService.create(userId,
            "Solde mis a jour 💰",
            "Votre solde total est maintenant de " + total + " points.",
            Notification.NotificationType.INFO
        );
    }

    @KafkaListener(topics = "badge.debloque", groupId = "notification-group")
    public void onBadgeDebloque(Map<String, Object> event) {
        log.info("📥 [Kafka] badge.debloque : {}", event);
        Long userId = requireUserId(event, "badge.debloque");
        if (userId == null) {
            return;
        }
        String badge = readString(event, "badge", "badge");
        String description = readString(event, "description", "");

        notificationService.create(userId,
            "Nouveau badge debloque 🏆",
            "Felicitations ! Vous avez debloque : " + badge,
            Notification.NotificationType.SUCCESS
        );

        if (event.containsKey("email")) {
            String email = event.get("email").toString();
            notificationService.sendEmail(email,
                "Nouveau badge debloque : " + badge + " 🏆",
                "Bonjour,\n\n" +
                "Vous venez de debloquer le badge : " + badge + "\n" +
                description + "\n\n" +
                "Continuez comme ca !\n\n" +
                "Consultez vos badges : https://ecopria.ma/espace\n" +
                "- L'equipe EcoPria"
            );
        }
    }

    @KafkaListener(topics = "recompense.echangee", groupId = "notification-group")
    public void onRecompenseEchangee(Map<String, Object> event) {
        log.info("📥 [Kafka] recompense.echangee : {}", event);
        Long userId = requireUserId(event, "recompense.echangee");
        if (userId == null) {
            return;
        }
        String coupon = readString(event, "codeCoupon", "");
        String pointsUsed = readString(event, "pointsUsed", "?");

        notificationService.create(userId,
            "Recompense obtenue 🎁",
            "Votre coupon : " + coupon + ". Utilisez-le en magasin.",
            Notification.NotificationType.SUCCESS
        );

        if (event.containsKey("email")) {
            String email = event.get("email").toString();
            notificationService.sendEmail(email,
                "Votre coupon EcoPria : " + coupon,
                "Bonjour,\n\n" +
                "Vous avez echange " + pointsUsed + " points contre une recompense.\n\n" +
                "Votre code coupon : " + coupon + "\n\n" +
                "Presentez ce code a notre partenaire pour utiliser votre recompense.\n\n" +
                "Consultez vos recompenses : https://ecopria.ma/espace/recompenses\n" +
                "- L'equipe EcoPria"
            );
        }
    }
}
