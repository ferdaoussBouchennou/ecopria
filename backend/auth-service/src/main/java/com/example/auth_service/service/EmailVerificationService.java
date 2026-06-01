package com.example.auth_service.service;

import com.example.auth_service.client.NotificationEmailClient;
import com.example.auth_service.dto.EmailVerificationEvent;
import com.example.auth_service.dto.RegisterRequest;
import com.example.auth_service.entity.EmailVerificationCode;
import com.example.auth_service.entity.RegistrationProfile;
import com.example.auth_service.entity.User;
import com.example.auth_service.repository.EmailVerificationCodeRepository;
import com.example.auth_service.repository.RegistrationProfileRepository;
import com.example.auth_service.repository.UserRepository;
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
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private static final int CODE_LENGTH = 6;
    private static final int MAX_ATTEMPTS = 5;

    private final EmailVerificationCodeRepository codeRepository;
    private final RegistrationProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final KafkaProducerService kafkaProducer;
    private final NotificationEmailClient notificationEmailClient;

  private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.email-verification.expiration-minutes:15}")
    private int expirationMinutes;

    @Value("${app.email-verification.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    @Value("${app.dev.log-verification-code:true}")
    private boolean logVerificationCodeInDev;

    @Transactional
    public void saveRegistrationProfile(Long userId, RegisterRequest request) {
        RegistrationProfile profile = RegistrationProfile.builder()
                .userId(userId)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .nom(request.getNom())
                .document(request.getDocument())
                .build();
        profileRepository.save(profile);
    }

    @Transactional
    public void issueAndSendCode(User user, String firstNameHint) {
        String plainCode = generateCode();
        LocalDateTime now = LocalDateTime.now();

        EmailVerificationCode entity = EmailVerificationCode.builder()
                .userId(user.getUserId())
                .codeHash(passwordEncoder.encode(plainCode))
                .expiresAt(now.plusMinutes(expirationMinutes))
                .isUsed(false)
                .attemptCount(0)
                .createdAt(now)
                .build();
        codeRepository.save(entity);

        if (logVerificationCodeInDev) {
            log.info("[DEV] Code de vérification pour {} : {}", user.getEmail(), plainCode);
        }

        EmailVerificationEvent event = EmailVerificationEvent.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(firstNameHint)
                .code(plainCode)
                .build();

        if (!notificationEmailClient.sendVerificationEmail(event)) {
            kafkaProducer.publishEmailVerification(event);
        }
    }

    @Transactional
    public User verifyCode(String email, String code) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            return user;
        }

        EmailVerificationCode active = codeRepository
                .findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Aucun code actif — demandez un nouvel envoi"));

        if (active.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code expiré — demandez un nouvel envoi");
        }

        if (active.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives — demandez un nouvel envoi");
        }

        active.setAttemptCount(active.getAttemptCount() + 1);
        codeRepository.save(active);

        if (!passwordEncoder.matches(code.trim(), active.getCodeHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code incorrect");
        }

        active.setIsUsed(true);
        codeRepository.save(active);

        user.setIsVerified(true);
        return userRepository.save(user);
    }

    @Transactional
    public void resendCode(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cet e-mail est déjà vérifié");
        }

        Optional<EmailVerificationCode> existingCode =
                codeRepository.findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(user.getUserId());
        if (existingCode.isPresent()) {
            EmailVerificationCode existing = existingCode.get();
            if (existing.getCreatedAt().plusSeconds(resendCooldownSeconds).isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Veuillez patienter " + resendCooldownSeconds + " secondes avant de renvoyer un code");
            }
            existing.setIsUsed(true);
            codeRepository.save(existing);
        }

        RegistrationProfile profile = profileRepository.findById(user.getUserId()).orElse(null);
        String firstName = profile != null ? profile.getFirstName() : "";
        issueAndSendCode(user, firstName);
    }

    public RegistrationProfile getProfile(Long userId) {
        return profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "Profil d'inscription introuvable"));
    }

    @Transactional
    public void deleteProfile(Long userId) {
        profileRepository.deleteById(userId);
    }

    private String generateCode() {
        int bound = (int) Math.pow(10, CODE_LENGTH);
        int value = secureRandom.nextInt(bound);
        return String.format("%0" + CODE_LENGTH + "d", value);
    }
}
