package com.example.admin_service.kafka.event;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorieEvent {
    private String nom;
    private String description;
    private String imageUrl;
}
