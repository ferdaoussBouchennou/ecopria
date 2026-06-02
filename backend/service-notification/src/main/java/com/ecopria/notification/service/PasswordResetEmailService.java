package com.ecopria.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PasswordResetEmailService {

    private final NotificationService notificationService;

    public void send(String email, String code) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Destinataire e-mail requis");
        }
        if (!StringUtils.hasText(code)) {
            throw new IllegalArgumentException("Code requis");
        }

        String subject = "Réinitialisation de votre mot de passe EcoPria";
        String body = "Bonjour,\n\n" +
                "Vous avez demandé à réinitialiser votre mot de passe EcoPria.\n\n" +
                "Voici votre code :\n\n" +
                code.trim() + "\n\n" +
                "Ce code expire dans 15 minutes.\n" +
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\n" +
                "- L'equipe EcoPria\n" +
                "https://ecopria.ma/reinitialiser-mot-de-passe";

        notificationService.sendEmail(email.trim(), subject, body);
    }
}
