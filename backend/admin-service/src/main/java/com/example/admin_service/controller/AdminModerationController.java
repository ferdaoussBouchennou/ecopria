package com.example.admin_service.controller;

import com.example.admin_service.dto.request.StatutChangeRequest;
import com.example.admin_service.dto.response.ModerationActionResponse;
import com.example.admin_service.service.AdminModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/moderation")
@RequiredArgsConstructor
public class AdminModerationController {

    private final AdminModerationService service;

    @GetMapping("/actions")
    public ResponseEntity<List<ModerationActionResponse>> listActions() {
        return ResponseEntity.ok(service.listActions());
    }

    @PutMapping("/actions/{id}/publish")
    public ResponseEntity<Void> publish(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.activate(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/actions/{id}/suspend")
    public ResponseEntity<Void> suspend(
            @PathVariable Long id,
            @RequestBody(required = false) StatutChangeRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        String raison = request == null ? null : request.getRaison();
        service.deactivate(id, raison, adminId);
        return ResponseEntity.noContent().build();
    }
}
