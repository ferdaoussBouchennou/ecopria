package com.ecopria.utilisateur.dto;

import lombok.Data;

@Data
public class AssociationAdminUpsertRequest {
    private Long authId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String description;
    private String logo;
}
