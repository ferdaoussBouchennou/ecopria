package com.example.auth_service.repository;

import com.example.auth_service.entity.VerificationDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, Long> {
}
