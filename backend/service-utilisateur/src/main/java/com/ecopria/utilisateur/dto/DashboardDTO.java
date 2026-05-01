package com.ecopria.utilisateur.dto;

import java.util.List;

import lombok.Data;

@Data
public class DashboardDTO {
    private String userType; // "CITIZEN", "ASSOCIATION", "PARTNER"
    private String name;     // Nom pour Asso/Partner ou Prénom + Nom pour Citoyen
    private String firstName;
    private String lastName;
    private String photo;
    private String city;
    
    // Specifique Citoyen
    private Integer totalPoints;
    private Integer level;
    private Integer rank;
    private List<BadgeInfo> badges;
    private List<PointsMovementInfo> pointHistory;
    
    // Specifique Asso / Partner (si besoin d'infos de base ici)
    private String description;

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
