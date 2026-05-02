package com.example.admin_service.kafka.event;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorieEvent {
    private Long categorieId;
    private String name;
    private String description;
    private String imageUrl;
    private String action; // CREEE or MODIFIEE
}
