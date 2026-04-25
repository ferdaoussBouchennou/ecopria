package com.ecopria.utilisateur.dto;

import lombok.Data;

@Data
public class LeaderboardEntryDTO {
    private Integer rank;
    private String lastName;
    private String firstName;
    private String city;
    private Integer totalPoints;
    private boolean isMe;     // true si c'est l'utilisateur connecté
}
