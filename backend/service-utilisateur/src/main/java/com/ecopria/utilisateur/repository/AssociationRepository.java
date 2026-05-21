package com.ecopria.utilisateur.repository;

import com.ecopria.utilisateur.model.Association;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssociationRepository extends JpaRepository<Association, Long> {
    java.util.Optional<Association> findByAuthId(Long authId);
}
