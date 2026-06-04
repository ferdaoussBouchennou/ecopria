package com.ecopria.inscription.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inscriptions")
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long actionId;

    @Column(nullable = false)
    private LocalDateTime dateInscription;

    @Column(nullable = false)
    private String statut;

    private Integer pointsAction;

    @Column(length = 1000)
    private String motivation;

    @Column(length = 1000)
    private String conditions;

    @Column(nullable = false)
    private Boolean imageRights = false;

    @Column(nullable = false)
    private Boolean newsletter = false;

    @Column(length = 100)
    private String participantFirstName;

    @Column(length = 100)
    private String participantLastName;

    @Column(length = 255)
    private String participantEmail;

    @Column(length = 30)
    private String participantPhone;

    @Column(length = 100)
    private String participantCity;

    @Column(nullable = false)
    private Boolean penalise = false;

    /** Si EN_ATTENTE : PLACES_COMPLETES ou TRUST_SCORE */
    @Column(length = 30)
    private String enAttenteMotif;

    public static final String MOTIF_PLACES = "PLACES_COMPLETES";
    public static final String MOTIF_TRUST = "TRUST_SCORE";

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
    public String getMotivation() { return motivation; }
    public void setMotivation(String motivation) { this.motivation = motivation; }
    public String getConditions() { return conditions; }
    public void setConditions(String conditions) { this.conditions = conditions; }
    public Boolean getImageRights() { return imageRights; }
    public void setImageRights(Boolean imageRights) { this.imageRights = imageRights; }
    public Boolean getNewsletter() { return newsletter; }
    public void setNewsletter(Boolean newsletter) { this.newsletter = newsletter; }
    public String getParticipantFirstName() { return participantFirstName; }
    public void setParticipantFirstName(String participantFirstName) { this.participantFirstName = participantFirstName; }
    public String getParticipantLastName() { return participantLastName; }
    public void setParticipantLastName(String participantLastName) { this.participantLastName = participantLastName; }
    public String getParticipantEmail() { return participantEmail; }
    public void setParticipantEmail(String participantEmail) { this.participantEmail = participantEmail; }
    public String getParticipantPhone() { return participantPhone; }
    public void setParticipantPhone(String participantPhone) { this.participantPhone = participantPhone; }
    public String getParticipantCity() { return participantCity; }
    public void setParticipantCity(String participantCity) { this.participantCity = participantCity; }
    public Boolean getPenalise() { return penalise; }
    public void setPenalise(Boolean penalise) { this.penalise = penalise; }
    public String getEnAttenteMotif() { return enAttenteMotif; }
    public void setEnAttenteMotif(String enAttenteMotif) { this.enAttenteMotif = enAttenteMotif; }
}