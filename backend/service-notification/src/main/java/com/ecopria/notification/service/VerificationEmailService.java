package com.ecopria.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class VerificationEmailService {

    private final NotificationService notificationService;

    public void send(String email, String code, String firstName) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Destinataire e-mail requis");
        }
        if (!StringUtils.hasText(code)) {
            throw new IllegalArgumentException("Code de vérification requis");
        }

        String greeting = StringUtils.hasText(firstName) ? "Bonjour " + firstName.trim() : "Bonjour";
        String subject = "Votre code de vérification EcoPria";
        String body = greeting + ",\n\n" +
                "Voici votre code pour activer votre compte EcoPria :\n\n" +
                code.trim() + "\n\n" +
                "Ce code expire dans 15 minutes.\n" +
                "Si vous n'avez pas demandé cette inscription, ignorez cet e-mail.\n\n" +
                "- L'equipe EcoPria\n" +
                "https://ecopria.ma/verifier-email";

        notificationService.sendEmail(email.trim(), subject, body);
    }
}
