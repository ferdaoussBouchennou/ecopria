package com.ecopria.inscription.repository;

import com.ecopria.inscription.model.Inscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    List<Inscription> findByUserId(Long userId);
    List<Inscription> findByActionId(Long actionId);
    Optional<Inscription> findByUserIdAndActionId(Long userId, Long actionId);
    boolean existsByUserIdAndActionId(Long userId, Long actionId);

    // ← NOUVEAU : pour la liste d'attente (ordonnée par date pour respecter l'ordre d'arrivée)
    List<Inscription> findByActionIdAndStatutOrderByDateInscriptionAsc(Long actionId, String statut);

    // ← Pour le job de pénalité d'absence
    List<Inscription> findByStatutAndPenalise(String statut, Boolean penalise);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.dateInscription >= :from")
    long countSince(@Param("from") LocalDateTime from);

    @Query("SELECT FUNCTION('DATE', i.dateInscription), COUNT(i) FROM Inscription i " +
            "WHERE i.dateInscription >= :from GROUP BY FUNCTION('DATE', i.dateInscription) " +
            "ORDER BY FUNCTION('DATE', i.dateInscription)")
    List<Object[]> countGroupedByDaySince(@Param("from") LocalDateTime from);
}