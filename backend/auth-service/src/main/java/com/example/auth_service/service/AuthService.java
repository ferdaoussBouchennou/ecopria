package com.example.auth_service.service;

import com.example.auth_service.dto.*;
import com.example.auth_service.entity.RegistrationProfile;
import com.example.auth_service.entity.*;
import com.example.auth_service.repository.*;
import com.example.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final KafkaProducerService kafkaProducer;
    private final TurnstileService turnstileService;
    private final EmailVerificationService emailVerificationService;
    private final OrganizationVerificationService organizationVerificationService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    // ── REGISTER ──────────────────────────────────────────
    public RegistrationResponse register(RegisterRequest request) {
        turnstileService.verifyToken(request.getCaptchaToken());

        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already used");
        }

        User.Role role = resolveRegisterRole(request.getRole());
        validateRolePayload(role, request);

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(role == User.Role.USER)
                .isVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);
        emailVerificationService.saveRegistrationProfile(user.getUserId(), request);

        String firstNameHint = request.getFirstName() != null ? request.getFirstName() : request.getNom();
        emailVerificationService.issueAndSendCode(user, firstNameHint);

        return RegistrationResponse.builder()
                .requiresEmailVerification(true)
                .userId(user.getUserId())
                .email(user.getEmail())
                .message("Un code de vérification a été envoyé à votre adresse e-mail.")
                .build();
    }

    // ── VERIFY EMAIL ───────────────────────────────────────
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = emailVerificationService.verifyCode(email, request.getCode());
        completeRegistrationAfterEmailVerified(user);
        return buildAuthResponse(user);
    }

    public void resendVerificationEmail(ResendVerificationRequest request) {
        emailVerificationService.resendCode(normalizeEmail(request.getEmail()));
    }

    // ── LOGIN ──────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
        }

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "EMAIL_NOT_VERIFIED");
        }

        if (user.getRole() != User.Role.USER && !Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Account pending admin verification");
        }

        if (user.getRole() == User.Role.USER && !Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Votre compte a été désactivé");
        }

        return buildAuthResponse(user);
    }

    // ── REFRESH TOKEN ──────────────────────────────────────
    public AuthResponse refresh(String token) {

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (refreshToken.getIsRevoked() ||
                refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token expired or revoked");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Revoke old token
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = jwtUtil.generateToken(
                user.getUserId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = createRefreshToken(user.getUserId());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(user.getRole().name())
                .userId(user.getUserId())
                .build();
    }

    // ── LOGOUT ────────────────────────────────────────────
    public void logout(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(rt -> {
            rt.setIsRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    public void handleAdminVerificationResponse(AdminVerificationDecisionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == User.Role.USER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USER does not require admin verification");
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            user.setIsActive(true);
            user.setIsVerified(true);
            userRepository.save(user);

            RegistrationProfile profile = emailVerificationService.getProfile(user.getUserId());

            kafkaProducer.publishAssociationValidated(UserRegisteredEvent.builder()
                    .userId(user.getUserId())
                    .nom(request.getNom())
                    .email(user.getEmail())
                    .phone(profile.getPhone())
                    .address(profile.getAddress())
                    .city(profile.getCity())
                    .document(null)
                    .role(user.getRole().name())
                    .build());
        } else {
            user.setIsActive(false);
            userRepository.save(user);
        }
    }

    private void completeRegistrationAfterEmailVerified(User user) {
        RegistrationProfile profile = emailVerificationService.getProfile(user.getUserId());

        if (user.getRole() == User.Role.USER) {
            kafkaProducer.publishUserRegistered(UserRegisteredEvent.builder()
                    .userId(user.getUserId())
                    .firstName(profile.getFirstName())
                    .lastName(profile.getLastName())
                    .email(user.getEmail())
                    .phone(profile.getPhone())
                    .address(profile.getAddress())
                    .city(profile.getCity())
                    .role(user.getRole().name())
                    .build());
        } else {
            organizationVerificationService.finalizeOrganizationAfterEmailVerified(user, profile);
            userRepository.save(user);
            kafkaProducer.publishAssociationPending(UserRegisteredEvent.builder()
                    .userId(user.getUserId())
                    .nom(profile.getNom())
                    .email(user.getEmail())
                    .phone(profile.getPhone())
                    .address(profile.getAddress())
                    .city(profile.getCity())
                    .document(profile.getDocument())
                    .role(user.getRole().name())
                    .build());
        }

        emailVerificationService.deleteProfile(user.getUserId());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateToken(
                user.getUserId(), user.getEmail(), user.getRole().name());
        String refreshToken = createRefreshToken(user.getUserId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .userId(user.getUserId())
                .build();
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    // ── HELPER ────────────────────────────────────────────
    private String createRefreshToken(Long userId) {
        String token = UUID.randomUUID().toString();
        RefreshToken refresh = RefreshToken.builder()
                .userId(userId)
                .token(token)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(refresh);
        return token;
    }

    private User.Role resolveRegisterRole(String rawRole) {
        try {
            User.Role role = User.Role.valueOf(rawRole.toUpperCase());
            if (role == User.Role.ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN cannot register");
            }
            return role;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role for registration");
        }
    }

    private void validateRolePayload(User.Role role, RegisterRequest request) {
        if (role == User.Role.USER) {
            if (!StringUtils.hasText(request.getFirstName()) || !StringUtils.hasText(request.getLastName())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USER requires first_name and last_name");
            }
            if (!StringUtils.hasText(request.getCity())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USER requires city");
            }
            return;
        }

        if (!StringUtils.hasText(request.getNom()) || !StringUtils.hasText(request.getDocument())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ASSOCIATION/PARTNER requires nom and document");
        }
    }

}