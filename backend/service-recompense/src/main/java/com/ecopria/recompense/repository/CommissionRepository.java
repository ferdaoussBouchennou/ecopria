package com.ecopria.recompense.repository;

import com.ecopria.recompense.model.Commission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, Long> {

    // historique des commissions d'un partenaire
    List<Commission> findByPartenaireIdOrderByCreatedAtDesc(Long partenaireId);

    // commissions d'un partenaire par mois
    List<Commission> findByPartenaireIdAndMoisFacturation(
            Long partenaireId, String moisFacturation);

    // total commissions d'un partenaire pour un mois
    @Query("SELECT SUM(c.montantCommission) FROM Commission c " +
            "WHERE c.partenaire.id = :partenaireId " +
            "AND c.moisFacturation = :mois")
    Double sumCommissionsByPartenaireAndMois(
            @Param("partenaireId") Long partenaireId,
            @Param("mois") String mois);

    // historique mensuel groupé
    @Query("SELECT c.moisFacturation, " +
            "COUNT(c), " +
            "SUM(c.valeurDh), " +
            "SUM(c.montantCommission) " +
            "FROM Commission c " +
            "WHERE c.partenaire.id = :partenaireId " +
            "GROUP BY c.moisFacturation " +
            "ORDER BY c.moisFacturation DESC")
    @Query("SELECT SUM(c.montantCommission) FROM Commission c")
    Double sumAllCommissions();
}