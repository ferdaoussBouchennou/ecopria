package com.example.admin_service.controller;


import com.example.admin_service.dto.request.CategorieRequest;
import com.example.admin_service.dto.response.CategorieResponse;
import com.example.admin_service.service.AdminCategorieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class AdminCategorieController {

    private final AdminCategorieService service;

    @GetMapping
    public ResponseEntity<List<CategorieResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @Valid @RequestBody CategorieRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.create(request, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @Valid @RequestBody CategorieRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        service.update(id, request, adminId);
        return ResponseEntity.noContent().build();
    }
}
