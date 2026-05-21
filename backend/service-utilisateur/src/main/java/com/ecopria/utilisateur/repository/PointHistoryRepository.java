package com.ecopria.utilisateur.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecopria.utilisateur.model.PointHistory;

public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {
    List<PointHistory> findByProfileIdOrderByCreatedAtDesc(Long profileId);
}