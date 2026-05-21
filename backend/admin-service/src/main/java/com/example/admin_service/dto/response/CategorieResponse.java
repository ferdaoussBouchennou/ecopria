package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorieResponse {
    private Long id;
    private String nom;
    private String description;
    private String imageUrl;
    private LocalDateTime updatedAt;
}
