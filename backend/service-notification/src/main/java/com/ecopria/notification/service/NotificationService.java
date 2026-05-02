package com.ecopria.notification.service;

import com.ecopria.notification.model.Notification;
import com.ecopria.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFromConfigured;

    @Value("${ecopria.mail.enforce:true}")
    private boolean enforceMailConfig;

    @PostConstruct
    void validateMailConfig() {
        if (enforceMailConfig && (mailFromConfigured == null || mailFromConfigured.isBlank())) {
            throw new IllegalStateException(
                    "Configuration e-mail manquante: spring.mail.username est vide. " +
                    "Renseignez EMAIL_USERNAME/EMAIL_PASSWORD (docker-compose) ou spring.mail.*");
        }
    }

    public Notification create(Long userId, String title, String message,
                                Notification.NotificationType type) {
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
            SimpleMailMessage mail = new SimpleMailMessage();
            if (mailFromConfigured != null && !mailFromConfigured.isBlank()) {
                mail.setFrom(mailFromConfigured.trim());
            }
            mail.setTo(to.trim());
            mail.setSubject(subject != null ? subject : "EcoPria");
            mail.setText(body != null ? body : "");
            mailSender.send(mail);
            log.info("Email envoye → {}", to);
        } catch (Exception e) {
            log.error("E-mail echoue → {} : {}", to, e.getMessage(), e);
        }
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
