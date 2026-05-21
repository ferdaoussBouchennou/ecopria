package com.ecopria.inscription.dto;

import java.time.LocalDateTime;

public class InscriptionResponseDTO {
    private Long id;
    private Long userId;
    private Long actionId;
    private LocalDateTime dateInscription;
    private String statut;
    private Integer pointsAction;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public LocalDateTime getDateInscription() { return dateInscription; }
    public void setDateInscription(LocalDateTime d) { this.dateInscription = d; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public Integer getPointsAction() { return pointsAction; }
    public void setPointsAction(Integer p) { this.pointsAction = p; }
}