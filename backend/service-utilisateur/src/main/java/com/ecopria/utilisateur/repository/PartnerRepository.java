package com.ecopria.utilisateur.repository;

import com.ecopria.utilisateur.model.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {
    java.util.Optional<Partner> findByAuthId(Long authId);
}
