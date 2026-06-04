package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationActionResponse {
    private Long id;
    private String title;
    private String categoryName;
    private String categoryImageUrl;
    private String city;
    private String dateStart;
    private String dateEnd;
    private Integer points;
    private Integer availablePlaces;
    private Integer maxParticipants;
    private Integer registeredCount;
    private Boolean isFixed;
    private String status;
    private String associationName;
    private List<String> photoUrls;
}
