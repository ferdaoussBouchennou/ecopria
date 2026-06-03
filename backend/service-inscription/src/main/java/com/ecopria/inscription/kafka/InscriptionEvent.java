package com.ecopria.inscription.kafka;

import java.time.LocalDateTime;

public class InscriptionEvent {
    private Long inscriptionId;
    private Long userId;
    private Long actionId;
    private LocalDateTime dateAction;  // ← remplace dateInscription
    private Long associationId;
    private String title;
    private String city;
    private String address;
    // qrCode et pointsAction supprimés — c'est service-presence qui gère le QR

    public InscriptionEvent() {}

    public InscriptionEvent(Long inscriptionId, Long userId, Long actionId, LocalDateTime dateAction, Long associationId, String title, String city, String address) {
        this.inscriptionId = inscriptionId;
        this.userId = userId;
        this.actionId = actionId;
        this.dateAction = dateAction;
        this.associationId = associationId;
        this.title = title;
        this.city = city;
        this.address = address;
    }

    public Long getInscriptionId() { return inscriptionId; }
    public void setInscriptionId(Long i) { this.inscriptionId = i; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public LocalDateTime getDateAction() { return dateAction; }
    public void setDateAction(LocalDateTime d) { this.dateAction = d; }
    public Long getAssociationId() { return associationId; }
    public void setAssociationId(Long a) { this.associationId = a; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public String getCity() { return city; }
    public void setCity(String c) { this.city = c; }
    public String getAddress() { return address; }
    public void setAddress(String a) { this.address = a; }
}