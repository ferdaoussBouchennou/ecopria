package com.example.admin_service.controller;


import com.example.admin_service.dto.request.CategorieRequest;
import com.example.admin_service.dto.response.CategorieResponse;
import com.example.admin_service.dto.response.CategoryImageUploadResponse;
import com.example.admin_service.service.AdminCategorieService;
import com.example.admin_service.service.CategoryImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class AdminCategorieController {

    private final AdminCategorieService service;
    private final CategoryImageStorageService imageStorageService;

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file) {
        String imageUrl = imageStorageService.store(file);
        return ResponseEntity.ok(CategoryImageUploadResponse.builder().imageUrl(imageUrl).build());
    }

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

    @PutMapping("/{id}/publish")
    public ResponseEntity<Void> publish(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.setPublished(id, true, adminId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/unpublish")
    public ResponseEntity<Void> unpublish(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.setPublished(id, false, adminId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        service.delete(id, adminId);
        return ResponseEntity.noContent().build();
    }
}
