package com.example.auth_service.repository;

import com.example.auth_service.entity.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    Optional<EmailVerificationCode> findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(Long userId);
}
