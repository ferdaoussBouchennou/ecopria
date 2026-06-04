package com.example.admin_service.controller;


import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.dto.response.AdminUserActionResponse;
import com.example.admin_service.dto.response.AdminUserResponse;
import com.example.admin_service.service.AdminUserService;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<AdminUserResponse>> getAll(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isVerified) {
        return ResponseEntity.ok(service.getAllUsers(email, role, isActive, isVerified));
    }

    @PutMapping("/{id}/ban")
    public ResponseEntity<AdminUserActionResponse> ban(
            @PathVariable Long id,
            @Valid @RequestBody StatutChangeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        return ResponseEntity.ok(service.banUser(id, request, adminId));
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<AdminUserActionResponse> reactivate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        return ResponseEntity.ok(service.reactivateUser(id, adminId));
    }
}
