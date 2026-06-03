package com.ecopria.utilisateur.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ecopria.utilisateur.model.Citizen;

import java.util.List;
import java.util.Optional;

public interface CitizenRepository extends JpaRepository<Citizen, Long> {
    Optional<Citizen> findByAuthId(Long authId);
    List<Citizen> findTop10ByOrderByTotalPointsDesc();
    List<Citizen> findByCityIgnoreCase(String city);

    @Query("SELECT COALESCE(SUM(c.totalPoints), 0) FROM Citizen c")
    Long sumTotalPoints();
}