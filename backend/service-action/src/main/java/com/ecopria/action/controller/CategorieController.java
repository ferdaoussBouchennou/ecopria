package com.ecopria.action.controller;

import com.ecopria.action.dto.CategorieDTO;
import com.ecopria.action.dto.CategoryEnsureRequest;
import com.ecopria.action.model.Categorie;
import com.ecopria.action.service.ActionService;
import com.ecopria.action.repository.CategorieRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieRepository categorieRepository;
    private final ActionService actionService;

    /** Catégories publiées — visible associations & citoyens */
    @GetMapping
    public ResponseEntity<List<CategorieDTO>> getAll() {
        List<CategorieDTO> categories = categorieRepository.findByPublishedTrueOrderByNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategorieDTO> getById(@PathVariable Long id) {
        return categorieRepository.findById(id)
                .map(this::mapToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/ensure")
    public ResponseEntity<CategorieDTO> ensureForAdmin(@Valid @RequestBody CategoryEnsureRequest request) {
        Categorie category = actionService.ensureCategoryExists(
                request.getNom(),
                request.getDescription(),
                request.getImageUrl(),
                request.getPublished()
        );
        return ResponseEntity.ok(mapToDTO(category));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteForAdmin(@PathVariable Long id) {
        actionService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/by-name/{name}")
    public ResponseEntity<Void> deleteForAdminByName(@PathVariable String name) {
        actionService.deleteCategoryByName(name);
        return ResponseEntity.noContent().build();
    }

    private CategorieDTO mapToDTO(Categorie c) {
        return CategorieDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .published(c.getPublished())
                .build();
    }
}
