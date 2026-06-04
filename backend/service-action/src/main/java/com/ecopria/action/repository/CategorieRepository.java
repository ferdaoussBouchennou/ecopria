package com.ecopria.action.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecopria.action.model.Categorie;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    Optional<Categorie> findByName(String name);
    Optional<Categorie> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);

    List<Categorie> findByPublishedTrueOrderByNameAsc();
}
