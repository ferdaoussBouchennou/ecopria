package com.ecopria.utilisateur.repository;

import com.ecopria.utilisateur.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByProfileId(Long profileId);

    boolean existsByProfileIdAndBadgeId(Long profileId, Long badgeId);

    @Query("""
            SELECT ub FROM UserBadge ub
            JOIN FETCH ub.badge b
            JOIN ub.profile p
            WHERE p.id IN :profileIds
            ORDER BY b.requiredPoints ASC
            """)
    List<UserBadge> findByProfileIdInWithBadge(@Param("profileIds") Collection<Long> profileIds);
}
