package com.example.admin_service.controller;

import com.example.admin_service.dto.request.StatutChangeRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/actions")
@RequiredArgsConstructor
public class AdminActionController {

    private final AdminActionService service;

    @GetMapping
    public ResponseEntity<List<?>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<Object> create(
            @RequestBody Map<String, Object> request,
            @RequestHeader("X-User-Id") Long adminId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, adminId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
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
