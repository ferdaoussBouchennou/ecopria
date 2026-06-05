package com.example.auth_service.service;

import com.example.auth_service.entity.AdminVerificationStatus;
import com.example.auth_service.entity.RegistrationProfile;
import com.example.auth_service.entity.User;
import com.example.auth_service.entity.VerificationDocument;
import com.example.auth_service.repository.RegistrationProfileRepository;
import com.example.auth_service.repository.UserRepository;
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
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationVerificationService {

    private final VerificationDocumentRepository documentRepository;
    private final VerificationDocumentService verificationDocumentService;
    private final UserRepository userRepository;
    private final RegistrationProfileRepository profileRepository;

    @Transactional
    public void persistDocumentFromPath(Long userId, String documentPath) {
        if (userId == null || !StringUtils.hasText(documentPath)) {
            return;
        }
        if (documentRepository.existsById(userId)) {
            return;
        }
        materializeFromPath(userId, documentPath.trim());
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
        // Le compte reste connectable : seul le statut admin passe à REJECTED (motif affiché côté org).
        user.setIsActive(true);
        user.setAdminVerificationStatus(AdminVerificationStatus.REJECTED);
        user.setRejectionReason(StringUtils.hasText(reason) ? reason.trim() : "Rejet administratif");
    }

    @Transactional
    public VerificationDocument getDocument(Long userId) {
        Optional<VerificationDocument> stored = documentRepository.findById(userId);
        if (stored.isPresent()) {
            return stored.get();
        }

        String documentPath = resolveDocumentPath(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Document de vérification introuvable"));

        return materializeFromPath(userId, documentPath);
    }

    private Optional<String> resolveDocumentPath(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent() && StringUtils.hasText(user.get().getVerificationDocument())) {
            return Optional.of(user.get().getVerificationDocument().trim());
        }
        return profileRepository.findById(userId)
                .map(RegistrationProfile::getDocument)
                .filter(StringUtils::hasText)
                .map(String::trim);
    }

    private VerificationDocument materializeFromPath(Long userId, String documentPath) {
        String filename = extractFilename(documentPath);
        if (!StringUtils.hasText(filename)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document de vérification introuvable");
        }
        try {
            Path file = verificationDocumentService.resolveStoredFile(filename);
            byte[] data = Files.readAllBytes(file);
            String contentType = Files.probeContentType(file);
            if (!StringUtils.hasText(contentType)) {
                contentType = guessContentType(filename);
            }

            VerificationDocument document = VerificationDocument.builder()
                    .userId(userId)
                    .originalFilename(filename)
                    .contentType(contentType)
                    .fileData(data)
                    .createdAt(LocalDateTime.now())
                    .build();

            try {
                document = documentRepository.save(document);
                syncUserDocumentMetadata(userId, documentPath);
                log.info("Document de vérification matérialisé en base pour userId={}", userId);
            } catch (Exception ex) {
                log.warn("Document servi depuis le disque (persistance BDD échouée) userId={}: {}",
                        userId, ex.getMessage());
            }
            return document;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Impossible de charger le document pour userId={}: {}", userId, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document de vérification introuvable");
        }
    }

    private void syncUserDocumentMetadata(Long userId, String documentPath) {
        userRepository.findById(userId).ifPresent(user -> {
            boolean changed = false;
            if (!StringUtils.hasText(user.getVerificationDocument())) {
                user.setVerificationDocument(documentPath);
                changed = true;
            }
            if (user.getRole() != User.Role.USER
                    && user.getAdminVerificationStatus() == null
                    && Boolean.TRUE.equals(user.getIsVerified())) {
                user.setAdminVerificationStatus(AdminVerificationStatus.PENDING);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        });
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
