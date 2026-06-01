package com.example.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "registration_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 30)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 200)
    private String nom;

    @Column(length = 500)
    private String document;
}
