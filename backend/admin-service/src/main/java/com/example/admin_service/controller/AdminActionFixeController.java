package com.example.admin_service.controller;


import com.example.admin_service.dto.request.ActionFixeRequest;
import com.example.admin_service.service.AdminActionFixeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/actions-fixes")
@RequiredArgsConstructor
public class AdminActionFixeController {

    private final AdminActionFixeService service;

    @GetMapping
    public ResponseEntity<List<?>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @Valid @RequestBody ActionFixeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.create(request, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @Valid @RequestBody ActionFixeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.update(id, request, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.deactivate(id, adminId);
        return ResponseEntity.noContent().build();
    }
}
