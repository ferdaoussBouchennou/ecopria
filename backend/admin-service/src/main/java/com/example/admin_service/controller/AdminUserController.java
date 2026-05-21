package com.example.admin_service.controller;


import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService service;

    @GetMapping
    public ResponseEntity<List<?>> getAll(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive) {
        return ResponseEntity.ok(service.getAllUsers(email, role, isActive));
    }

    @PutMapping("/{id}/ban")
    public ResponseEntity<Void> ban(
            @PathVariable Long id,
            @RequestBody StatutChangeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.banUser(id, request, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<Void> reactivate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.reactivateUser(id, adminId);
        return ResponseEntity.noContent().build();
    }
}
