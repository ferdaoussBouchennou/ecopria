package com.ecopria.presence.repository;



import com.ecopria.presence.model.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PresenceRepository extends JpaRepository<Presence, Long> {
    boolean existsByUserIdAndActionId(Long userId, Long actionId);
    List<Presence> findByUserId(Long userId);
    List<Presence> findByActionId(Long actionId);

    @Query("SELECT COALESCE(SUM(p.points), 0) FROM Presence p WHERE p.actionId IN :actionIds")
    Long sumPointsByActionIds(@Param("actionIds") Collection<Long> actionIds);

    @Query("SELECT p.actionId, COALESCE(SUM(p.points), 0) FROM Presence p WHERE p.actionId IN :actionIds GROUP BY p.actionId")
    List<Object[]> sumPointsGroupedByActionIds(@Param("actionIds") Collection<Long> actionIds);
}
