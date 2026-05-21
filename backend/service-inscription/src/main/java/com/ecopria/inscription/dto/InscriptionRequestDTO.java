package com.ecopria.inscription.dto;

public class InscriptionRequestDTO {
    private Long userId;
    private Long actionId;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
}