package com.example.admin_service.kafka.event;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActionFixeEvent {
    private Long actionFixeId;
    private String titre;
    private String categorie;
    private Long categorieId;
    private String lieu;
    private String city;
    private Double latitude;
    private Double longitude;
    private Integer points;
    private Integer placesTotal;
    private String frequence;
    private LocalDateTime dateStart;
    private LocalDateTime dateEnd;
    private Long associationId;
    private Boolean isActive;
}
