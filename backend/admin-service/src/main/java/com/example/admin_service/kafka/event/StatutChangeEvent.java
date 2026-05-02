package com.example.admin_service.kafka.event;


import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StatutChangeEvent {
    private Long userId;
    private String email;
    private String action;
    private String raison;
    private String type; // USER, ASSOCIATION, PARTENAIRE
}
