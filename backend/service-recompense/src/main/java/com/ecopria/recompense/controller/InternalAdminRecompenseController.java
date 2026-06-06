package com.ecopria.recompense.controller;

import com.ecopria.recompense.dto.admin.*;
import com.ecopria.recompense.service.AdminRecompenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/admin")
@RequiredArgsConstructor
public class InternalAdminRecompenseController {

    private final AdminRecompenseService adminRecompenseService;

    @GetMapping("/offres")
    public ResponseEntity<List<AdminOffreDTO>> listOffres() {
        return ResponseEntity.ok(adminRecompenseService.listOffres());
    }

    @PutMapping("/offres/{id}/activate")
    public ResponseEntity<AdminOffreDTO> activateOffre(@PathVariable Long id) {
        return ResponseEntity.ok(adminRecompenseService.activateOffre(id));
    }

    @PutMapping("/offres/{id}/suspend")
    public ResponseEntity<AdminOffreDTO> suspendOffre(@PathVariable Long id) {
        return ResponseEntity.ok(adminRecompenseService.suspendOffre(id));
    }

    @GetMapping("/commissions")
    public ResponseEntity<List<AdminCommissionDTO>> listCommissions() {
        return ResponseEntity.ok(adminRecompenseService.listCommissions());
    }

    @GetMapping("/commissions/summary")
    public ResponseEntity<AdminCommissionSummaryDTO> commissionSummary() {
        return ResponseEntity.ok(adminRecompenseService.commissionSummary());
    }

    @GetMapping("/avis")
    public ResponseEntity<List<AdminAvisDTO>> listAvis() {
        return ResponseEntity.ok(adminRecompenseService.listAvis());
    }

    @PutMapping("/avis/{id}/hide")
    public ResponseEntity<AdminAvisDTO> hideAvis(@PathVariable Long id) {
        return ResponseEntity.ok(adminRecompenseService.hideAvis(id));
    }

    @PutMapping("/avis/{id}/show")
    public ResponseEntity<AdminAvisDTO> showAvis(@PathVariable Long id) {
        return ResponseEntity.ok(adminRecompenseService.showAvis(id));
    }

    @DeleteMapping("/avis/{id}")
    public ResponseEntity<Void> deleteAvis(@PathVariable Long id) {
        adminRecompenseService.deleteAvis(id);
        return ResponseEntity.noContent().build();
    }
}
