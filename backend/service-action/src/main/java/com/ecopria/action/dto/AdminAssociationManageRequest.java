package com.ecopria.action.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminAssociationManageRequest {
    @NotBlank
    private String name;

    private String description;
    private String logoUrl;
    private String city;

    @NotNull
    private Long userId;

    private Boolean validated;
    private String email;
    private String phone;
    private String address;
}
