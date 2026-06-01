package com.example.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_used")
    private Boolean isUsed = false;

    @Column(name = "attempt_count")
    private Integer attemptCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
