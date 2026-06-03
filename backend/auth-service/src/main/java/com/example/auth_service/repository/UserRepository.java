package com.example.auth_service.repository;

import com.example.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.auth_service.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByCreatedAtAfter(LocalDateTime dateTime);

    long countByIsActiveTrueAndIsVerifiedTrue();

    long countByRoleAndIsVerifiedTrueAndIsActiveFalse(User.Role role);

    List<User> findByRoleInAndIsVerifiedTrueAndIsActiveFalse(List<User.Role> roles);

    List<User> findByRoleInAndIsVerifiedTrueAndIsActiveTrue(List<User.Role> roles);

    List<User> findByRoleInAndIsActiveFalseAndIsVerifiedTrue(List<User.Role> roles);
}