package com.example.admin_service.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminRecompenseAvisResponse {
    private Long id;
    private Long partenaireId;
    private String partenaireName;
    private String authorName;
    private Integer rating;
    private String comment;
    private String reponse;
    private Boolean visible;
    private LocalDateTime createdAt;
}
