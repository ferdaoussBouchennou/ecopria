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