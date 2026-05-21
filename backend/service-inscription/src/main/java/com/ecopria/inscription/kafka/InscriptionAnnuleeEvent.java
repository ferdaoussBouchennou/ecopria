package com.ecopria.inscription.kafka;

public class InscriptionAnnuleeEvent {
    private Long inscriptionId;
    private Long userId;
    private Long actionId;

    public InscriptionAnnuleeEvent() {}

    public InscriptionAnnuleeEvent(Long inscriptionId, Long userId, Long actionId) {
        this.inscriptionId = inscriptionId;
        this.userId = userId;
        this.actionId = actionId;
    }

    public Long getInscriptionId() { return inscriptionId; }
    public void setInscriptionId(Long i) { this.inscriptionId = i; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
}