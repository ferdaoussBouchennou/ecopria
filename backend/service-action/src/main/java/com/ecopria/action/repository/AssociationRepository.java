package com.ecopria.action.repository;

import com.ecopria.action.model.Association;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AssociationRepository extends JpaRepository<Association, Long> {
    Optional<Association> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
