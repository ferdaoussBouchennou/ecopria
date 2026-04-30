package com.ecopria.utilisateur.dto;
import lombok.Data;

@Data
public class ProfilDTO {
    private Long userId;
    private String lastName;
    private String firstName;
    private String photo;
    private String city;
    private Integer totalPoints;
    private Integer level;
}