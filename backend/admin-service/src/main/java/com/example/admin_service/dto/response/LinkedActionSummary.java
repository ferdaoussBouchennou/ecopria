package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkedActionSummary {
    private Long id;
    private String title;
    private String status;
    private String city;
    private String associationName;
    private Boolean isFixed;
}
