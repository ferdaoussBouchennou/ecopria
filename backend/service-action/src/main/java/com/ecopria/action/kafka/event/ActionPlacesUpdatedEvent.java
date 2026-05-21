package com.ecopria.action.kafka.event;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionPlacesUpdatedEvent {
    private Long actionId;
    private Integer availablePlaces;
    private Integer maxParticipants;
}