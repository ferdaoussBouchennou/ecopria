package com.ecopria.presence.kafka;



import java.time.LocalDateTime;

public class InscriptionConfirmeeEvent {
    private Long inscriptionId;
    private Long userId;
    private Long actionId;
    private LocalDateTime dateAction;

    public InscriptionConfirmeeEvent() {}

    public Long getInscriptionId() { return inscriptionId; }
    public void setInscriptionId(Long i) { this.inscriptionId = i; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public LocalDateTime getDateAction() { return dateAction; }
    public void setDateAction(LocalDateTime d) { this.dateAction = d; }
}
