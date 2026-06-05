package com.example.auth_service.controller;

import com.example.auth_service.dto.CreateAssociationUserRequest;
import com.example.auth_service.dto.CreateAssociationUserResponse;
import com.example.auth_service.dto.OrganizationAccountsPageResponse;
import com.example.auth_service.dto.PendingAccountResponse;
import com.example.auth_service.dto.RejectOrganizationRequest;
import com.example.auth_service.dto.UserInternalResponse;
import com.example.auth_service.dto.UserStatsResponse;
import com.example.auth_service.entity.VerificationDocument;
import com.example.auth_service.service.InternalUserService;
import com.example.auth_service.service.OrganizationVerificationService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final InternalUserService service;
    private final OrganizationVerificationService organizationVerificationService;

    // Get all users
    @GetMapping
    public ResponseEntity<List<UserInternalResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/pending-accounts")
    public ResponseEntity<List<PendingAccountResponse>> getPendingAccounts() {
        return ResponseEntity.ok(service.getPendingAccounts());
    }

    @GetMapping("/organization-accounts")
    public ResponseEntity<OrganizationAccountsPageResponse> getOrganizationAccounts(
            @RequestParam(defaultValue = "pending") String status,
            @RequestParam(required = false) String rejectedIds) {
        return ResponseEntity.ok(service.getOrganizationAccounts(status, parseRejectedIds(rejectedIds)));
    }

    private List<Long> parseRejectedIds(String rejectedIds) {
        if (rejectedIds == null || rejectedIds.isBlank()) {
            return List.of();
        }
        List<Long> ids = new java.util.ArrayList<>();
        for (String part : rejectedIds.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                ids.add(Long.parseLong(trimmed));
            } catch (NumberFormatException ignored) {
                // skip invalid id
            }
        }
        return ids;
    }

    // Get one user by id
    @GetMapping("/{id}")
    public ResponseEntity<UserInternalResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // Ban user → isActive = false
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    // Reactivate user → isActive = true
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        service.activate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reject-organization")
    public ResponseEntity<Void> rejectOrganization(
            @PathVariable Long id,
            @RequestBody(required = false) RejectOrganizationRequest request) {
        String reason = request != null ? request.getRaison() : null;
        service.rejectOrganization(id, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/verification-document")
    public ResponseEntity<byte[]> getVerificationDocument(@PathVariable Long id) {
        VerificationDocument document = organizationVerificationService.getDocument(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + document.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .body(document.getFileData());
    }

    @PostMapping("/association")
    public ResponseEntity<CreateAssociationUserResponse> createAssociationUser(
            @Valid @RequestBody CreateAssociationUserRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(service.createAssociationUser(request));
    }
}