package com.ecopria.inscription.kafka;

import java.time.LocalDateTime;

public class InscriptionEvent {
    private Long inscriptionId;
    private Long userId;
    private Long actionId;
    private LocalDateTime dateAction;  // ← remplace dateInscription

    // qrCode et pointsAction supprimés — c'est service-presence qui gère le QR

    public InscriptionEvent() {}

    public InscriptionEvent(Long inscriptionId, Long userId, Long actionId, LocalDateTime dateAction) {
        this.inscriptionId = inscriptionId;
        this.userId = userId;
        this.actionId = actionId;
        this.dateAction = dateAction;
    }

    public Long getInscriptionId() { return inscriptionId; }
    public void setInscriptionId(Long i) { this.inscriptionId = i; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public LocalDateTime getDateAction() { return dateAction; }
    public void setDateAction(LocalDateTime d) { this.dateAction = d; }
}