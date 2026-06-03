package com.ecopria.inscription.kafka;

import java.time.LocalDateTime;

public class InscriptionEvent {
    private Long inscriptionId;
    private Long userId;
    private Long actionId;
    private LocalDateTime dateAction;
    private Long associationId;
    private Long associationUserId;
    private String title;
    private String city;
    private String address;
    private String statut;
    private String email;
    private String firstName;
    private Integer pointsAction;

    public InscriptionEvent() {}

    public InscriptionEvent(Long inscriptionId,
                            Long userId,
                            Long actionId,
                            LocalDateTime dateAction,
                            Long associationId,
                            Long associationUserId,
                            String title,
                            String city,
                            String address,
                            String statut,
                            String email,
                            String firstName,
                            Integer pointsAction) {
        this.inscriptionId = inscriptionId;
        this.userId = userId;
        this.actionId = actionId;
        this.dateAction = dateAction;
        this.associationId = associationId;
        this.associationUserId = associationUserId;
        this.title = title;
        this.city = city;
        this.address = address;
        this.statut = statut;
        this.email = email;
        this.firstName = firstName;
        this.pointsAction = pointsAction;
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
    public Long getAssociationUserId() { return associationUserId; }
    public void setAssociationUserId(Long associationUserId) { this.associationUserId = associationUserId; }
    /** Alias pour le consumer notification (Kafka Map). */
    public String getActionTitle() { return title; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public String getCity() { return city; }
    public void setCity(String c) { this.city = c; }
    public String getAddress() { return address; }
    public void setAddress(String a) { this.address = a; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public Integer getPointsAction() { return pointsAction; }
    public void setPointsAction(Integer pointsAction) { this.pointsAction = pointsAction; }
}
