package com.ecopria.utilisateur.repository;
import com.ecopria.utilisateur.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByProfileId(Long profileId);
    boolean existsByProfileIdAndBadgeId(Long profileId, Long badgeId);
}