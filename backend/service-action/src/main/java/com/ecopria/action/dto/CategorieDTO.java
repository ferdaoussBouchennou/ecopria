package com.ecopria.action.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategorieDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Boolean published;
}