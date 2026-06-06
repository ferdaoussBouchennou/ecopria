package com.ecopria.recompense.dto.admin;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAvisDTO {
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
