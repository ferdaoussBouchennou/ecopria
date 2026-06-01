package com.example.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;
    @NotBlank
    @Size(min = 8, max = 255)
    private String password;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    private String phone;

    private String address;

    private String city;

    private String nom;

    private String document;

    @NotBlank
    @Pattern(regexp = "(?i)USER|ASSOCIATION|PARTNER")
    private String role = "USER";

    @JsonProperty("captcha_token")
    private String captchaToken;
}