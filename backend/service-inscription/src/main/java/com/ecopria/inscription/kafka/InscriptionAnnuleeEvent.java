package com.ecopria.inscription.kafka;

public class InscriptionAnnuleeEvent {
    private Long inscriptionId;
    private Long userId;
    private Long actionId;
    /** Statut avant annulation (CONFIRMEE → libère une place). */
    private String statut;
    private String actionTitle;

    public InscriptionAnnuleeEvent() {}

    public InscriptionAnnuleeEvent(Long inscriptionId, Long userId, Long actionId, String statut, String actionTitle) {
        this.inscriptionId = inscriptionId;
        this.userId = userId;
        this.actionId = actionId;
        this.statut = statut;
        this.actionTitle = actionTitle;
    }

    public Long getInscriptionId() { return inscriptionId; }
    public void setInscriptionId(Long i) { this.inscriptionId = i; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getActionTitle() { return actionTitle; }
    public void setActionTitle(String actionTitle) { this.actionTitle = actionTitle; }
}
