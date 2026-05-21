package com.ecopria.notification.client.dto;

import lombok.Data;

@Data
public class CitizenContactSnapshot {
    private Long authId;
    private String email;
    private String firstName;
}
