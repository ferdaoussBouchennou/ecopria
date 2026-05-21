package com.ecopria.action.kafka.event;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionCancelledEvent {
    private Long actionId;
    private String title;
    private String cancellationReason;
}