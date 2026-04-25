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
public class ActionDetailDTO {
    private Long id;
    private String title;
    private String description;
    private String categoryName;
    private String address;
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
    private List<String> program;
    private List<String> practicalInfos;
    private List<String> photoUrls;

    // infos de l'association organisatrice
    private Long associationId;
    private String associationName;
    private String associationDescription;
    private String associationLogoUrl;
    private String associationCity;
}