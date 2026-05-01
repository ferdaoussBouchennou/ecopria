package com.ecopria.presence.repository;



import com.ecopria.presence.model.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PresenceRepository extends JpaRepository<Presence, Long> {
    boolean existsByUserIdAndActionId(Long userId, Long actionId);
    List<Presence> findByUserId(Long userId);
    List<Presence> findByActionId(Long actionId);
}
