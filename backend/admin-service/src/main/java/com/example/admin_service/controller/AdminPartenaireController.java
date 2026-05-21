package com.example.admin_service.controller;

import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.service.AdminPartenaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/partenaires")
@RequiredArgsConstructor
public class AdminPartenaireController {

    private final AdminPartenaireService service;

    @GetMapping
    public ResponseEntity<List<?>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<?>> getPending() {
        return ResponseEntity.ok(service.getPending());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approve(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.approve(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable Long id,
            @RequestBody StatutChangeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.reject(id, request, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @RequestBody StatutChangeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.deactivate(id, request, adminId);
        return ResponseEntity.noContent().build();
    }
}
