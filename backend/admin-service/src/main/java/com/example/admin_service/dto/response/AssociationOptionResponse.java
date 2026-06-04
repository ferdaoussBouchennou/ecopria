package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssociationOptionResponse {
    private Long id;
    private Long userId;
    private String name;
    private String city;
    private Boolean validated;
}
