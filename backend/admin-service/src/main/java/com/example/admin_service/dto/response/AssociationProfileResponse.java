package com.example.admin_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AssociationProfileResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String description;
    private String logoUrl;
    private Boolean validated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Present only when a password was auto-generated on create. */
    private String temporaryPassword;
}
