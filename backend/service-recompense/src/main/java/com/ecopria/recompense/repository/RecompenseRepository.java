package com.ecopria.recompense.repository;

import com.ecopria.recompense.model.Recompense;
import com.ecopria.recompense.model.Recompense.RecompenseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecompenseRepository extends JpaRepository<Recompense, Long> {

    // catalogue public — seulement les actives
    List<Recompense> findByIsActiveTrue();

    // catalogue filtré par type
    List<Recompense> findByIsActiveTrueAndType(RecompenseType type);

    // offres d'un partenaire
    List<Recompense> findByPartenaireId(Long partenaireId);

    // offres actives d'un partenaire
    List<Recompense> findByPartenaireIdAndIsActiveTrue(Long partenaireId);

    // compter les offres actives d'un partenaire
    Long countByPartenaireIdAndIsActiveTrue(Long partenaireId);

    @Query("SELECT r FROM Recompense r JOIN FETCH r.partenaire ORDER BY r.createdAt DESC")
    List<Recompense> findAllWithPartenaireOrderByCreatedAtDesc();
}