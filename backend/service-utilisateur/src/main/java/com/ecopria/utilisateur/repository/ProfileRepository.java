package com.ecopria.utilisateur.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecopria.utilisateur.model.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);
    List<Profile> findTop10ByOrderByTotalPointsDesc();  // classement top 10
}