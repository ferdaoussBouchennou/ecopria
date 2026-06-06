package com.example.auth_service.service;

import com.example.auth_service.client.NotificationEmailClient;
import com.example.auth_service.entity.ResetToken;
import com.example.auth_service.entity.User;
import com.example.auth_service.repository.ResetTokenRepository;
import com.example.auth_service.repository.UserRepository;
import com.example.auth_service.validation.PasswordPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final int CODE_LENGTH = 6;

    private final UserRepository userRepository;
    private final ResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationEmailClient notificationEmailClient;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.password-reset.expiration-minutes:15}")
    private int expirationMinutes;

    @Value("${app.password-reset.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    @Value("${app.dev.log-verification-code:true}")
    private boolean logCodeInDev;

    @Transactional
    public void requestReset(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) {
            // Ne pas révéler si l'e-mail existe
            log.info("Demande de réinitialisation pour e-mail inconnu : {}", email);
            return;
        }

        resetTokenRepository.findTopByUserIdAndIsUsedFalseOrderByExpiresAtDesc(user.getUserId())
                .ifPresent(existing -> {
                    if (existing.getCreatedAt() != null
                            && existing.getCreatedAt().plusSeconds(resendCooldownSeconds).isAfter(LocalDateTime.now())) {
                        throw new ResponseStatusException(
                                HttpStatus.TOO_MANY_REQUESTS,
                                "Veuillez patienter " + resendCooldownSeconds + " secondes avant un nouvel envoi");
                    }
                    existing.setIsUsed(true);
                    resetTokenRepository.save(existing);
                });

        String plainCode = generateCode();
        LocalDateTime now = LocalDateTime.now();
        ResetToken entity = ResetToken.builder()
                .userId(user.getUserId())
                .token(passwordEncoder.encode(plainCode))
                .expiresAt(now.plusMinutes(expirationMinutes))
                .isUsed(false)
                .createdAt(now)
                .sessionToken(null)
                .build();
        resetTokenRepository.save(entity);

        if (logCodeInDev) {
            log.info("[DEV] Code de réinitialisation pour {} : {}", user.getEmail(), plainCode);
        }

        notificationEmailClient.sendPasswordResetEmail(user.getEmail(), plainCode);
    }

    @Transactional
    public String verifyCode(String email, String code) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré"));

        ResetToken active = resetTokenRepository
                .findTopByUserIdAndIsUsedFalseAndSessionTokenIsNullOrderByCreatedAtDesc(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré"));

        if (active.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code expiré — demandez un nouvel envoi");
        }

        if (!passwordEncoder.matches(code.trim(), active.getToken())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code incorrect");
        }

        String sessionToken = UUID.randomUUID().toString();
        active.setSessionToken(sessionToken);
        active.setExpiresAt(LocalDateTime.now().plusMinutes(expirationMinutes));
        resetTokenRepository.save(active);
        return sessionToken;
    }

    @Transactional
    public void resetPassword(String sessionToken, String newPassword) {
        ResetToken resetToken = resetTokenRepository.findBySessionTokenAndIsUsedFalse(sessionToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lien de réinitialisation invalide ou expiré"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lien de réinitialisation expiré");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));

        PasswordPolicy.requireStrong(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setIsUsed(true);
        resetTokenRepository.save(resetToken);
    }

    private String generateCode() {
        int bound = (int) Math.pow(10, CODE_LENGTH);
        int value = secureRandom.nextInt(bound);
        return String.format("%0" + CODE_LENGTH + "d", value);
    }
}
