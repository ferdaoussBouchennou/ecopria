package com.ecopria.recompense.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvisDTO {
    private Long id;
    private String authorName;
    private Integer rating;
    private String comment;
    private String reponse;
    private LocalDateTime createdAt;
}
