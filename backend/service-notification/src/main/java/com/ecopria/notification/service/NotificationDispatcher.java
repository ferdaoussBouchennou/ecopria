package com.ecopria.notification.service;

import com.ecopria.notification.client.AuthContactClient;
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
    private final AuthContactClient authContactClient;

    public void notifyUser(Long authId,
                           String title,
                           String inAppMessage,
                           Notification.NotificationType type,
                           String mailSubject,
                           String mailBody,
                           String emailFromPayload) {
        if (notificationService.create(authId, title, inAppMessage, type) == null) {
            log.debug("[notif] notification in-app ignoree (doublon) authId={} title={}", authId, title);
            return;
        }
        String email = resolveEmail(authId, emailFromPayload);
        boolean wantsEmail = mailSubject != null && !mailSubject.isBlank()
                && mailBody != null && !mailBody.isBlank();
        if (wantsEmail && email != null && !email.isBlank()) {
            notificationService.sendEmail(email, mailSubject, mailBody);
        } else if (wantsEmail) {
            log.warn("[notif] authId={} : e-mail introuvable — in-app seulement ({})", authId, title);
        }
    }

    private String resolveEmail(Long authId, String emailFromPayload) {
        if (emailFromPayload != null && !emailFromPayload.isBlank()) {
            return emailFromPayload.trim();
        }
        return utilisateurContactClient.getEmail(authId)
                .or(() -> authContactClient.getEmail(authId))
                .orElse(null);
    }
}
