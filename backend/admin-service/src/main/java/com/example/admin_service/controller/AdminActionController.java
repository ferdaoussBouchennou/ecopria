package com.example.admin_service.controller;

import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.dto.request.ActionAssociationRequest;
import com.example.admin_service.dto.response.AssociationOptionResponse;
import com.example.admin_service.service.AdminActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/actions")
@RequiredArgsConstructor
public class AdminActionController {

    private final AdminActionService service;

    @GetMapping("/associations")
    public ResponseEntity<List<AssociationOptionResponse>> getAssociations() {
        return ResponseEntity.ok(service.getAssociations());
    }

    @GetMapping
    public ResponseEntity<List<?>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("photo") MultipartFile photo) throws IOException {
        return ResponseEntity.ok(service.uploadPhoto(id, photo));
    }

    @PostMapping
    public ResponseEntity<Object> create(
            @RequestBody ActionAssociationRequest request,
            @RequestHeader("X-User-Id") Long adminId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, adminId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @RequestBody ActionAssociationRequest request,
            @RequestHeader("X-User-Id") Long adminId
    ) {
        service.update(id, request, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId
    ) {
        service.activate(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @RequestBody(required = false) StatutChangeRequest request,
            @RequestHeader("X-User-Id") Long adminId
    ) {
        String raison = request == null ? null : request.getRaison();
        service.deactivate(id, raison, adminId);
        return ResponseEntity.noContent().build();
    }
}
