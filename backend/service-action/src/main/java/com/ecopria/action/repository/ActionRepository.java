package com.ecopria.action.repository;

import com.ecopria.action.model.Action;
import com.ecopria.action.model.Action.ActionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActionRepository extends JpaRepository<Action, Long> {

    // liste publique — seulement PUBLISHED
    List<Action> findByStatus(ActionStatus status);

    // filtrer par catégorie et statut
    List<Action> findByCategoryIdAndStatus(Long categoryId, ActionStatus status);

    long countByCategoryId(Long categoryId);

    // actions d'une association
    List<Action> findByAssociationId(Long associationId);

    // actions d'une association par statut (brouillons, publiées...)
    List<Action> findByAssociationIdAndStatus(Long associationId, ActionStatus status);

    // actions fixes uniquement
    List<Action> findByIsFixedTrueAndStatus(ActionStatus status);

    // trouver une action fixe par son ID dans le service admin
    Optional<Action> findByActionFixeId(Long actionFixeId);

    // pour le cron — terminer les actions passées
    List<Action> findByStatusAndDateEndBefore(ActionStatus status, LocalDateTime date);

    // pour la carte — toutes les PUBLISHED avec coordonnées GPS
    @Query("SELECT a FROM Action a WHERE a.status = 'PUBLISHED' " +
            "AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL")
    List<Action> findAllForMap();

    // pour la carte — filtrée par catégorie
    @Query("SELECT a FROM Action a WHERE a.status = 'PUBLISHED' " +
            "AND a.category.id = :categoryId " +
            "AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL")
    List<Action> findByCategoryForMap(@Param("categoryId") Long categoryId);

    // recherche par mot clé
    @Query("SELECT a FROM Action a WHERE a.status = 'PUBLISHED' AND (" +
            "LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(a.city) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Action> searchByKeyword(@Param("keyword") String keyword);

    // compter les actions d'une association
    Long countByAssociationId(Long associationId);

    // vérifier disponibilité — appelé par service-inscription
    @Query("SELECT a.availablePlaces FROM Action a WHERE a.id = :actionId")
    Integer findAvailablePlacesById(@Param("actionId") Long actionId);

    long countByStatus(ActionStatus status);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.status = 'PUBLISHED' AND a.dateEnd >= :now")
    long countActivePublished(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.createdAt >= :from")
    long countCreatedSince(@Param("from") LocalDateTime from);

    /** Inscriptions = places réservées (max − disponibles) sur actions publiées ou terminées. */
    @Query("""
            SELECT COALESCE(SUM(a.maxParticipants - a.availablePlaces), 0)
            FROM Action a
            WHERE a.status IN ('PUBLISHED', 'COMPLETED')
            """)
    long sumRegisteredParticipants();
}