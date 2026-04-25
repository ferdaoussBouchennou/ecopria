package com.ecopria.action.controller;

import com.ecopria.action.dto.CategorieDTO;
import com.ecopria.action.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieRepository categorieRepository;

    @GetMapping
    public ResponseEntity<List<CategorieDTO>> getAll() {
        List<CategorieDTO> categories = categorieRepository.findAll()
                .stream()
                .map(c -> CategorieDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .imageUrl(c.getImageUrl())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }
}