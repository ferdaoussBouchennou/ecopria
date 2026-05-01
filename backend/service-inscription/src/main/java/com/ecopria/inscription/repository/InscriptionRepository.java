package com.ecopria.inscription.repository;

import com.ecopria.inscription.model.Inscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    List<Inscription> findByUserId(Long userId);
    List<Inscription> findByActionId(Long actionId);
    Optional<Inscription> findByUserIdAndActionId(Long userId, Long actionId);
    boolean existsByUserIdAndActionId(Long userId, Long actionId);

    // ← NOUVEAU : pour la liste d'attente (ordonnée par date pour respecter l'ordre d'arrivée)
    List<Inscription> findByActionIdAndStatutOrderByDateInscriptionAsc(Long actionId, String statut);
}