package com.example.admin_service.dto.response;


import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConfigurationResponse {
    private Long id;
    private String cle;
    private String valeur;
    private String description;
    private LocalDateTime updatedAt;
}
