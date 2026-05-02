package com.example.admin_service.repository;

import com.example.admin_service.model.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfigurationRepository extends JpaRepository<Configuration, Long> {
    Optional<Configuration> findByCle(String cle);
}
