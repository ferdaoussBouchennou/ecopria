package com.ecopria.utilisateur.dto;

import java.util.List;

import lombok.Data;

@Data
public class TableauDeBordDTO {
    private String lastName;
    private String firstName;
    private String photo;
    private Integer totalPoints;
    private Integer level;
    private Integer rank;              // sa position dans le leaderboard
    private Integer validatedActions;         // nombre d'actions avec présence validée
    private List<BadgeInfo> badges;
    private List<PointsMovementInfo> pointHistory;

    @Data
    public static class BadgeInfo {
        private String name;
        private String description;
        private String icon;
        private boolean obtained;
    }

    @Data
    public static class PointsMovementInfo {
        private String date;
        private String description;
        private Integer amount;
        private String type;    // "CREDIT" ou "DEBIT"
    }
}
