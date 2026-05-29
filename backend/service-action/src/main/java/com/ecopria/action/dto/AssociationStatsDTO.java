package com.ecopria.action.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AssociationStatsDTO {
    private int totalActions;
    private int totalPublished;
    private int totalParticipants;
    private int totalPlaces;
    private int totalPoints;
}
