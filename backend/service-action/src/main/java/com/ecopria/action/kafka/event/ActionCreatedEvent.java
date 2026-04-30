package com.ecopria.action.kafka.event;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionCreatedEvent {
    private Long actionId;
    private String title;
    private String category;
    private String city;
    private Double latitude;
    private Double longitude;
    private LocalDateTime dateStart;
    private LocalDateTime dateEnd;
    private Integer points;
    private Integer maxParticipants;
}