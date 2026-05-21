package com.ecopria.utilisateur.repository;
import com.ecopria.utilisateur.model.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByRequiredPointsLessThanEqual(Integer points);
}