package com.ecopria.action.dto;

import com.ecopria.action.model.Action.ActionStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionAvailabilityDTO {
    private Long actionId;
    private Integer availablePlaces;
    private Integer maxParticipants;
    private Integer points;
    private ActionStatus status;
    private Boolean hasAvailablePlaces;
}