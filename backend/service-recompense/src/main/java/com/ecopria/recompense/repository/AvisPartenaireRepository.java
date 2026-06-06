package com.ecopria.recompense.repository;

import com.ecopria.recompense.model.AvisPartenaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AvisPartenaireRepository extends JpaRepository<AvisPartenaire, Long> {

    List<AvisPartenaire> findByPartenaireIdOrderByCreatedAtDesc(Long partenaireId);

    @Query("SELECT AVG(a.rating) FROM AvisPartenaire a WHERE a.partenaire.id = :partenaireId AND a.visible = true")
    Double averageRatingByPartenaire(@Param("partenaireId") Long partenaireId);

    Long countByPartenaireId(Long partenaireId);

    @Query("SELECT COUNT(a) FROM AvisPartenaire a WHERE a.partenaire.id = :partenaireId AND a.visible = true")
    Long countVisibleByPartenaireId(@Param("partenaireId") Long partenaireId);

    @Query("SELECT a FROM AvisPartenaire a JOIN FETCH a.partenaire ORDER BY a.createdAt DESC")
    List<AvisPartenaire> findAllWithPartenaireOrderByCreatedAtDesc();
}
