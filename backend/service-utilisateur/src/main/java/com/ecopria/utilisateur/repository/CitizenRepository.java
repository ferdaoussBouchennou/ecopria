package com.ecopria.utilisateur.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecopria.utilisateur.model.Citizen;

public interface CitizenRepository extends JpaRepository<Citizen, Long> {
    Optional<Citizen> findByAuthId(Long authId);
    List<Citizen> findTop10ByOrderByTotalPointsDesc();  // classement top 10

    List<Citizen> findByCityIgnoreCase(String city);
}