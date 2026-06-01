package com.example.auth_service.repository;

import com.example.auth_service.entity.RegistrationProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationProfileRepository extends JpaRepository<RegistrationProfile, Long> {
}
