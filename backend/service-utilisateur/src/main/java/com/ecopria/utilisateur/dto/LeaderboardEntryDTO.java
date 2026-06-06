package com.ecopria.utilisateur.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class LeaderboardEntryDTO {
    private Integer rank;
    private String lastName;
    private String firstName;
    private String city;
    private Integer totalPoints;
    @JsonProperty("isMe")
    private boolean isMe;
    private List<LeaderboardBadgeDTO> badges = new ArrayList<>();
}
