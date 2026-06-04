package com.ecopria.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserAccountStatusEmailService {

    private final NotificationService notificationService;

    public void sendDeactivated(String email, String raison) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Destinataire e-mail requis");
        }
        String reason = StringUtils.hasText(raison) ? raison.trim() : "Non précisée";

        String subject = "Votre compte EcoPria a été banni";
        String body = "Bonjour,\n\n" +
                "Nous vous informons que votre compte EcoPria a été banni (désactivé) par notre équipe.\n\n" +
                "Raison indiquée :\n" +
                reason + "\n\n" +
                "Vous ne pouvez plus vous connecter tant que le compte reste banni.\n" +
                "Si vous pensez qu'il s'agit d'une erreur, contactez-nous en répondant à cet e-mail " +
                "ou via le support EcoPria.\n\n" +
                "- L'équipe EcoPria\n" +
                "https://ecopria.ma";

        notificationService.sendEmailStrict(email.trim(), subject, body);
    }

    public void sendReactivated(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Destinataire e-mail requis");
        }

        String subject = "Votre compte EcoPria a été réactivé";
        String body = "Bonjour,\n\n" +
                "Bonne nouvelle : votre compte EcoPria a été réactivé.\n\n" +
                "Vous pouvez à nouveau vous connecter et utiliser la plateforme normalement.\n\n" +
                "Nous vous remercions de votre compréhension.\n\n" +
                "- L'équipe EcoPria\n" +
                "https://ecopria.ma/connexion";

        notificationService.sendEmailStrict(email.trim(), subject, body);
    }
}
