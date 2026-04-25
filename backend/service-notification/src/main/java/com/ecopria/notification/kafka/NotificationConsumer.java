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

    @KafkaListener(topics = "user.inscrit", groupId = "notification-group")
    public void onUserInscrit(Map<String, Object> event) {
        log.info("📥 [Kafka] user.inscrit : {}", event);

        Object userIdObj = event.getOrDefault("userId", event.get("id"));
        if (userIdObj == null) { log.error("userId manquant dans user.inscrit"); return; }
        Long userId = Long.valueOf(userIdObj.toString());

        String firstName = event.getOrDefault("firstName", "").toString();

        notificationService.create(userId,
            "Welcome to EcoPria 🌿",
            "Your account has been created. Join your first ecological action!",
            Notification.NotificationType.SUCCESS
        );

        if (event.containsKey("email")) {
            String email = event.get("email").toString();
            notificationService.sendEmail(email,
                "Welcome to EcoPria 🌿",
                "Hello " + firstName + ",\n\n" +
                "Welcome to EcoPria! Your account is ready.\n" +
                "Join ecological actions and earn points.\n\n" +
                "The EcoPria Team"
            );
        }
    }

    @KafkaListener(topics = "inscription.confirmee", groupId = "notification-group")
    public void onInscriptionConfirmee(Map<String, Object> event) {
        log.info("📥 [Kafka] inscription.confirmee : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());

        notificationService.create(userId,
            "Registration confirmed ✅",
            "You are registered! Your QR Code will be generated automatically.",
            Notification.NotificationType.SUCCESS
        );
    }

    @KafkaListener(topics = "inscription.annulee", groupId = "notification-group")
    public void onInscriptionAnnulee(Map<String, Object> event) {
        log.info("📥 [Kafka] inscription.annulee : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());

        notificationService.create(userId,
            "Unregistration recorded",
            "You have been unregistered from the action.",
            Notification.NotificationType.INFO
        );
    }

    @KafkaListener(topics = "presence.validee", groupId = "notification-group")
    public void onPresenceValidee(Map<String, Object> event) {
        log.info("📥 [Kafka] presence.validee : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());
        String points = event.get("points").toString();

        notificationService.create(userId,
            "Presence validated 🎉",
            "Congratulations! +" + points + " points credited to your account.",
            Notification.NotificationType.SUCCESS
        );
    }

    @KafkaListener(topics = "fraude.detectee", groupId = "notification-group")
    public void onFraudeDetectee(Map<String, Object> event) {
        log.warn("🚨 [Kafka] fraude.detectee : {}", event);
        notificationService.create(1L,
            "🚨 Fraud detected",
            "User #" + event.get("userId") + " — Reason: " + event.get("raison"),
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
        Long userId = Long.valueOf(event.get("userId").toString());
        String total = event.get("totalPoints").toString();

        notificationService.create(userId,
            "Balance updated 💰",
            "Your total balance is now " + total + " points.",
            Notification.NotificationType.INFO
        );
    }

    @KafkaListener(topics = "badge.debloque", groupId = "notification-group")
    public void onBadgeDebloque(Map<String, Object> event) {
        log.info("📥 [Kafka] badge.debloque : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());
        String badge = event.get("badge").toString();

        notificationService.create(userId,
            "New badge unlocked 🏆",
            "Congratulations! You unlocked: " + badge,
            Notification.NotificationType.SUCCESS
        );
    }

    @KafkaListener(topics = "recompense.echangee", groupId = "notification-group")
    public void onRecompenseEchangee(Map<String, Object> event) {
        log.info("📥 [Kafka] recompense.echangee : {}", event);
        Long userId = Long.valueOf(event.get("userId").toString());
        String coupon = event.get("codeCoupon").toString();

        notificationService.create(userId,
            "Reward obtained 🎁",
            "Your coupon: " + coupon + ". Use it in store.",
            Notification.NotificationType.SUCCESS
        );
    }
}
