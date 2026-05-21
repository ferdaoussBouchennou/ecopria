package com.example.admin_service.kafka.event;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActionFixeEvent {
    private Long actionFixeId;
    private String titre;
    private String categorie;
    private String lieu;
    private Double latitude;
    private Double longitude;
    private Integer points;
    private Integer placesTotal;
}
