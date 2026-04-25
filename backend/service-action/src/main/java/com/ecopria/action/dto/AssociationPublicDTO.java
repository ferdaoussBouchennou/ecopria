package com.ecopria.action.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssociationPublicDTO {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String city;
    private Long totalActions; // calculé
    private List<ActionSummaryDTO> upcomingActions;
}