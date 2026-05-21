package com.ecopria.presence.dto;


import java.time.LocalDateTime;

public class PresenceResponseDTO {
    private Long id;
    private Long userId;
    private Long actionId;
    private Integer points;
    private LocalDateTime dateValidation;
    private String statut;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime d) { this.dateValidation = d; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
