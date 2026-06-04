package com.ecopria.notification.service;

import com.ecopria.notification.model.Notification;
import com.ecopria.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.util.StringUtils;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;
    private final Environment environment;

    @Value("${spring.mail.username:}")
    private String mailFromConfigured;

    @Value("${ecopria.mail.enforce:false}")
    private boolean enforceMailConfig;

    @PostConstruct
    void validateMailConfig() {
        String from = resolveMailFrom();
        if (!StringUtils.hasText(from)) {
            log.error("EMAIL_USERNAME / spring.mail.username est VIDE — aucun e-mail ne sera envoyé. "
                    + "Renseignez .env à la racine (ecopria/.env) puis redémarrez service-notification.");
        } else {
            log.info("SMTP configuré — expéditeur : {}", from);
        }
        if (enforceMailConfig && !StringUtils.hasText(resolveMailFrom())) {
            throw new IllegalStateException(
                    "Configuration e-mail manquante: spring.mail.username est vide. " +
                    "Renseignez EMAIL_USERNAME/EMAIL_PASSWORD (docker-compose) ou spring.mail.*");
        }
    }

    public Notification create(Long userId, String title, String message,
                                Notification.NotificationType type) {
        if (userId != null && title != null && message != null) {
            LocalDateTime since = LocalDateTime.now().minusMinutes(5);
            if (notificationRepository.existsByUserIdAndTitleAndMessageAndCreatedAtAfter(
                    userId, title, message, since)) {
                log.debug("[notif] doublon ignore pour userId={} : {}", userId, title);
                return null;
            }
        }
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        return notificationRepository.save(n);
    }

    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            log.warn("E-mail ignore : destinataire vide");
            return;
        }
        try {
            String safeSubject = subject != null && !subject.isBlank() ? subject : "EcoPria";
            String text = body != null ? body : "";
            String html = buildHtmlEmail(safeSubject, text);

            MimeMessage mime = mailSender.createMimeMessage();
            // multipart=true requis pour setText(plain, html)
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            String from = resolveMailFrom();
            if (StringUtils.hasText(from)) {
                helper.setFrom(from);
            }
            helper.setTo(to.trim());
            helper.setSubject(safeSubject);
            // multipart alternative: texte + HTML
            helper.setText(text, html);

            mailSender.send(mime);
            log.info("Email envoye → {}", to);
        } catch (Exception e) {
            log.error("E-mail ECHOUE → {} — {}. Verifiez EMAIL_USERNAME/EMAIL_PASSWORD (.env) et redemarrez "
                    + "service-notification (docker compose up -d --force-recreate service-notification-backend).",
                    to, e.getMessage(), e);
        }
    }

    /** Appels internes (admin / auth) : remonte l'erreur si l'envoi échoue. */
    public void sendEmailStrict(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException("Destinataire e-mail requis");
        }
        String from = resolveMailFrom();
        if (!StringUtils.hasText(from)) {
            throw new IllegalStateException(
                    "SMTP non configuré (EMAIL_USERNAME vide). Vérifiez le fichier .env à la racine du projet.");
        }
        try {
            String safeSubject = subject != null && !subject.isBlank() ? subject : "EcoPria";
            String text = body != null ? body : "";
            String html = buildHtmlEmail(safeSubject, text);

            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to.trim());
            helper.setSubject(safeSubject);
            helper.setText(text, html);

            mailSender.send(mime);
            log.info("Email envoye → {}", to);
        } catch (Exception e) {
            log.error("E-mail echoue → {} : {}", to, e.getMessage(), e);
            throw new IllegalStateException("Impossible d'envoyer l'e-mail : " + e.getMessage(), e);
        }
    }

    private String resolveMailFrom() {
        if (StringUtils.hasText(mailFromConfigured)) {
            return mailFromConfigured.trim();
        }
        String fromEnv = environment.getProperty("EMAIL_USERNAME");
        return StringUtils.hasText(fromEnv) ? fromEnv.trim() : null;
    }

    private static final Pattern URL_PATTERN = Pattern.compile("(https?://[^\\s<]+)");

    private String buildHtmlEmail(String subject, String textBody) {
        String escaped = escapeHtml(textBody == null ? "" : textBody);
        String withBreaks = escaped.replace("\r\n", "\n").replace("\n", "<br/>");

        // auto-link URLs
        Matcher m = URL_PATTERN.matcher(withBreaks);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String url = m.group(1);
            String link = "<a href=\"" + url + "\" style=\"color:#16a34a;text-decoration:none;\">" + url + "</a>";
            m.appendReplacement(sb, Matcher.quoteReplacement(link));
        }
        m.appendTail(sb);

        String preview = subject != null ? escapeHtml(subject) : "EcoPria";
        String year = String.valueOf(java.time.Year.now().getValue());

        StringBuilder html = new StringBuilder(4096);
        html.append("<!doctype html>");
        html.append("<html lang=\"fr\">");
        html.append("<head>");
        html.append("<meta charset=\"utf-8\"/>");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>");
        html.append("<title>").append(preview).append("</title>");
        html.append("</head>");
        html.append("<body style=\"margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;\">");
        html.append("<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">").append(preview).append("</div>");
        html.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background:#f6f7f9;padding:24px 12px;\">");
        html.append("<tr><td align=\"center\">");
        html.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"max-width:600px;width:100%;\">");

        // Header (bar only, avoid repeated text)
        html.append("<tr><td style=\"padding:0 0 14px 0;\">");
        html.append("<div style=\"height:4px;background:#16a34a;border-radius:999px;\"></div>");
        html.append("</td></tr>");

        // Card
        html.append("<tr><td style=\"background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:22px;\">");
        html.append("<div style=\"font-size:14px;line-height:1.55;color:#111827;\">").append(sb).append("</div>");
        html.append("<div style=\"margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9;font-size:12px;line-height:1.5;color:#6b7280;\">");
        html.append("Vous recevez cet e-mail suite à une activité sur votre compte EcoPria.");
        html.append("</div>");
        html.append("</td></tr>");

        // Footer
        html.append("<tr><td style=\"padding:14px 4px 0 4px;font-size:12px;color:#9ca3af;\">");
        html.append("© ").append(year).append(" EcoPria. Tous droits réservés.");
        html.append("</td></tr>");

        html.append("</table>");
        html.append("</td></tr>");
        html.append("</table>");
        html.append("</body></html>");

        return html.toString();
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public List<Notification> getAll(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId).size();
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
