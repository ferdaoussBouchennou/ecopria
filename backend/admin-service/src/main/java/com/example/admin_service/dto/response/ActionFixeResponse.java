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
public class ActionFixeResponse {
    private Long id;
    private String titre;
    private String description;
    private String categorie;
    private String lieu;
    private Double latitude;
    private Double longitude;
    private Integer points;
    private Integer placesTotal;
    private Boolean active;
    private LocalDateTime updatedAt;
}
