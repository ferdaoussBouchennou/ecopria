package com.example.admin_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssociationProfileRequest {
    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    /** Optional on create — auto-generated when blank. */
    private String password;

    private String phone;
    private String address;
    private String city;
    private String description;
    private String logoUrl;
    private Boolean validated;
}
