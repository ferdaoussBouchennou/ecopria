package com.example.admin_service.controller;

import com.example.admin_service.dto.response.*;
import com.example.admin_service.service.AdminRecompenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/recompenses")
@RequiredArgsConstructor
public class AdminRecompenseController {

    private final AdminRecompenseService service;

    @GetMapping("/offres")
    public ResponseEntity<List<AdminRecompenseOffreResponse>> listOffres() {
        return ResponseEntity.ok(service.listOffres());
    }

    @PutMapping("/offres/{id}/activate")
    public ResponseEntity<Void> activateOffre(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.activateOffre(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/offres/{id}/suspend")
    public ResponseEntity<Void> suspendOffre(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.suspendOffre(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/commissions")
    public ResponseEntity<List<AdminRecompenseCommissionResponse>> listCommissions() {
        return ResponseEntity.ok(service.listCommissions());
    }

    @GetMapping("/commissions/summary")
    public ResponseEntity<AdminRecompenseCommissionSummaryResponse> commissionSummary() {
        return ResponseEntity.ok(service.commissionSummary());
    }

    @GetMapping("/avis")
    public ResponseEntity<List<AdminRecompenseAvisResponse>> listAvis() {
        return ResponseEntity.ok(service.listAvis());
    }

    @PutMapping("/avis/{id}/hide")
    public ResponseEntity<Void> hideAvis(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.hideAvis(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/avis/{id}/show")
    public ResponseEntity<Void> showAvis(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.showAvis(id, adminId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/avis/{id}")
    public ResponseEntity<Void> deleteAvis(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.deleteAvis(id, adminId);
        return ResponseEntity.noContent().build();
    }
}
