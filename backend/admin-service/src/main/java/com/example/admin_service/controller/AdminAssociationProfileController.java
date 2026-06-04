package com.example.admin_service.controller;

import com.example.admin_service.dto.request.AssociationProfileRequest;
import com.example.admin_service.dto.response.AssociationProfileResponse;
import com.example.admin_service.service.AdminAssociationProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/association-profiles")
@RequiredArgsConstructor
public class AdminAssociationProfileController {

    private final AdminAssociationProfileService service;

    @GetMapping
    public ResponseEntity<List<AssociationProfileResponse>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssociationProfileResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<AssociationProfileResponse> create(
            @Valid @RequestBody AssociationProfileRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, adminId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssociationProfileResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AssociationProfileRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        return ResponseEntity.ok(service.update(id, request, adminId));
    }

    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadLogo(
            @PathVariable Long id,
            @RequestParam("logo") MultipartFile logo) throws IOException {
        return ResponseEntity.ok(service.uploadLogo(id, logo));
    }
}
