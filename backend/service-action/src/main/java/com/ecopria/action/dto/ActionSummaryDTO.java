package com.ecopria.action.dto;

import com.ecopria.action.model.Action.ActionStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionSummaryDTO {
    private Long id;
    private String title;
    private String categoryName;
    private String categoryImageUrl;
    private String city;
    private Double latitude;
    private Double longitude;
    private LocalDateTime dateStart;
    private LocalDateTime dateEnd;
    private Integer points;
    private Integer availablePlaces;
    private Integer maxParticipants;
    private Integer registeredCount; // calculé
    private Boolean isFixed;
    private ActionStatus status;
    private List<String> photoUrls; // URLs des photos de l'action
}