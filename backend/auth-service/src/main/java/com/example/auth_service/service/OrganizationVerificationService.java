package com.example.auth_service.service;

import com.example.auth_service.entity.AdminVerificationStatus;
import com.example.auth_service.entity.RegistrationProfile;
import com.example.auth_service.entity.User;
import com.example.auth_service.entity.VerificationDocument;
import com.example.auth_service.repository.VerificationDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationVerificationService {

    private final VerificationDocumentRepository documentRepository;
    private final VerificationDocumentService verificationDocumentService;

    @Transactional
    public void persistDocumentFromPath(Long userId, String documentPath) {
        if (userId == null || !StringUtils.hasText(documentPath)) {
            return;
        }
        String filename = extractFilename(documentPath);
        if (!StringUtils.hasText(filename)) {
            return;
        }
        try {
            Path file = verificationDocumentService.resolveStoredFile(filename);
            byte[] data = Files.readAllBytes(file);
            String contentType = Files.probeContentType(file);
            if (!StringUtils.hasText(contentType)) {
                contentType = guessContentType(filename);
            }
            documentRepository.save(VerificationDocument.builder()
                    .userId(userId)
                    .originalFilename(filename)
                    .contentType(contentType)
                    .fileData(data)
                    .createdAt(LocalDateTime.now())
                    .build());
            log.info("Document de vérification stocké en base pour userId={}", userId);
        } catch (Exception ex) {
            log.warn("Impossible de stocker le document en base pour userId={}: {}", userId, ex.getMessage());
        }
    }

    @Transactional
    public void finalizeOrganizationAfterEmailVerified(User user, RegistrationProfile profile) {
        user.setOrganizationName(profile.getNom());
        user.setVerificationDocument(profile.getDocument());
        user.setAdminVerificationStatus(AdminVerificationStatus.PENDING);
        user.setRejectionReason(null);
        persistDocumentFromPath(user.getUserId(), profile.getDocument());
    }

    @Transactional
    public void markApproved(User user) {
        user.setIsActive(true);
        user.setAdminVerificationStatus(AdminVerificationStatus.APPROVED);
        user.setRejectionReason(null);
    }

    @Transactional
    public void markRejected(User user, String reason) {
        user.setIsActive(false);
        user.setAdminVerificationStatus(AdminVerificationStatus.REJECTED);
        user.setRejectionReason(StringUtils.hasText(reason) ? reason.trim() : "Rejet administratif");
    }

    @Transactional(readOnly = true)
    public VerificationDocument getDocument(Long userId) {
        return documentRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Document de vérification introuvable"));
    }

    private static String extractFilename(String documentPath) {
        if (!StringUtils.hasText(documentPath)) {
            return null;
        }
        String trimmed = documentPath.trim();
        int slash = trimmed.lastIndexOf('/');
        return slash >= 0 ? trimmed.substring(slash + 1) : trimmed;
    }

    private static String guessContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        return "application/octet-stream";
    }
}
