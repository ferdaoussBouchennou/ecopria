package com.ecopria.action.controller;

import com.ecopria.action.dto.CategorieDTO;
import com.ecopria.action.dto.CategoryAdminDetailDTO;
import com.ecopria.action.dto.CategoryEnsureRequest;
import com.ecopria.action.dto.CategoryLinkedActionDTO;
import com.ecopria.action.dto.CategorySyncRequest;
import com.ecopria.action.model.Categorie;
import com.ecopria.action.service.ActionService;
import com.ecopria.action.repository.CategorieRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
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

    @GetMapping("/admin/all")
    public ResponseEntity<List<CategoryAdminDetailDTO>> getAllForAdmin() {
        return ResponseEntity.ok(actionService.listAllCategoriesForAdmin());
    }

    @GetMapping("/admin/by-name/{name}/linked-actions")
    public ResponseEntity<List<CategoryLinkedActionDTO>> linkedActionsByName(@PathVariable String name) {
        return ResponseEntity.ok(actionService.listActionsLinkedToCategoryByName(name));
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

    @PutMapping("/admin/sync")
    public ResponseEntity<CategorieDTO> syncForAdmin(@Valid @RequestBody CategorySyncRequest request) {
        Categorie category = actionService.syncCategoryFromAdmin(request);
        return ResponseEntity.ok(mapToDTO(category));
    }

    @GetMapping("/admin/by-name/{name}/usage")
    public ResponseEntity<Map<String, Object>> usageByName(@PathVariable String name) {
        long count = actionService.countActionsUsingCategoryByName(name);
        return ResponseEntity.ok(Map.of(
                "name", name,
                "actionCount", count
        ));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteForAdmin(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean cascade) {
        actionService.deleteCategory(id, cascade);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/by-name/{name}")
    public ResponseEntity<Void> deleteForAdminByName(
            @PathVariable String name,
            @RequestParam(defaultValue = "false") boolean cascade) {
        actionService.deleteCategoryByName(name, cascade);
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
