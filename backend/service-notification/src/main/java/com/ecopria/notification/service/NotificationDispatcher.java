package com.ecopria.notification.service;

import com.ecopria.notification.client.UtilisateurContactClient;
import com.ecopria.notification.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Chaque événement : notification in-app (persistée) + e-mail si une adresse est connue
 * (champ de l'événement ou résolution via service-utilisateur).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

    private final NotificationService notificationService;
    private final UtilisateurContactClient utilisateurContactClient;

    public void notifyUser(Long authId,
                           String title,
                           String inAppMessage,
                           Notification.NotificationType type,
                           String mailSubject,
                           String mailBody,
                           String emailFromPayload) {
        notificationService.create(authId, title, inAppMessage, type);
        String email = (emailFromPayload != null && !emailFromPayload.isBlank())
                ? emailFromPayload.trim()
                : utilisateurContactClient.getEmail(authId).orElse(null);
        if (email != null && !email.isBlank()) {
            notificationService.sendEmail(email, mailSubject, mailBody);
        } else {
            log.warn("[notif] authId={} : e-mail introuvable — in-app seulement ({})", authId, title);
        }
    }
}
