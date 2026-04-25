package com.ecopria.action.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateActionDTO {
    @Size(max = 200)
    private String title;
    private String description;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private LocalDateTime dateStart;
    private LocalDateTime dateEnd;
    private Integer points;
    private Integer maxParticipants;
    private List<String> program;
    private List<String> practicalInfos;
}