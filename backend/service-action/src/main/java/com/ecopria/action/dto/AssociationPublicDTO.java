package com.ecopria.action.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssociationPublicDTO {
    private Long id;
    /** authId du compte association (service-auth). */
    private Long userId;
    private String name;
    private String description;
    private String logoUrl;
    private String city;
}
