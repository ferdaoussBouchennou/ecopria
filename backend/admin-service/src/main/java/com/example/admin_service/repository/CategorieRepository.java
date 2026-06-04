package com.example.admin_service.repository;

import com.example.admin_service.model.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategorieRepository extends JpaRepository<Categorie, Long> {
    Optional<Categorie> findByNomIgnoreCase(String nom);

    boolean existsByNomIgnoreCase(String nom);
}
