package com.example.auth_service.service;

import com.example.auth_service.dto.*;
import com.example.auth_service.entity.*;
import com.example.auth_service.repository.*;
import com.example.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    // ── REGISTER ──────────────────────────────────────────
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already used");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .isActive(true)
                .isVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        // Publish to Kafka → user-service will create the profile
        kafkaProducer.publishUserRegistered(UserRegisteredEvent.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build());

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

    // ── LOGIN ──────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        if (!user.getIsActive()) {
            throw new RuntimeException("Your account has been banned");
        }

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
}