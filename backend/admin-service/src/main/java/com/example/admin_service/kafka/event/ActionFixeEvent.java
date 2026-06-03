package com.example.admin_service.kafka.event;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActionFixeEvent {
    private Long actionFixeId;
    private String titre;
    private String description;
    private String categorie;
    private Integer points;
}
