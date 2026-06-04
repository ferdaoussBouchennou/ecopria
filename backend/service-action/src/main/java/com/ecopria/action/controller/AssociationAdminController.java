package com.ecopria.action.controller;

import com.ecopria.action.dto.AdminAssociationManageRequest;
import com.ecopria.action.dto.AssociationDetailDTO;
import com.ecopria.action.service.AssociationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/associations/admin")
@RequiredArgsConstructor
public class AssociationAdminController {

    private final AssociationService associationService;

    @GetMapping
    public ResponseEntity<List<AssociationDetailDTO>> listAll() {
        return ResponseEntity.ok(associationService.listDetailsForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssociationDetailDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(associationService.getDetailForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<AssociationDetailDTO> create(
            @Valid @RequestBody AdminAssociationManageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(associationService.adminCreate(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssociationDetailDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody AdminAssociationManageRequest request) {
        return ResponseEntity.ok(associationService.adminUpdate(id, request));
    }

    @PutMapping("/{id}/logo")
    public ResponseEntity<AssociationDetailDTO> updateLogo(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String logoUrl = body != null ? body.get("logoUrl") : null;
        return ResponseEntity.ok(associationService.adminUpdateLogoUrl(id, logoUrl));
    }
}
