package com.ecopria.recompense.kafka.event;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecompenseEpuiseeEvent {
    private Long partenaireUserId;
    private Long recompenseId;
    private String recompenseTitle;
    private String partenaireName;
}
