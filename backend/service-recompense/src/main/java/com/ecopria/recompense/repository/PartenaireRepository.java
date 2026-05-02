package com.ecopria.recompense.repository;

import com.ecopria.recompense.model.Partenaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PartenaireRepository extends JpaRepository<Partenaire, Long> {
    Optional<Partenaire> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}