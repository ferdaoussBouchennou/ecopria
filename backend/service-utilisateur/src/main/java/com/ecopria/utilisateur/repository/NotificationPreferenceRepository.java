package com.ecopria.utilisateur.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecopria.utilisateur.model.NotificationPreference;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    Optional<NotificationPreference> findByAuthId(Long authId);
}
