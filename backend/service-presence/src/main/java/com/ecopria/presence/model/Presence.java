package com.ecopria.presence.model;



import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "presences")
public class Presence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long actionId;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private LocalDateTime dateValidation;

    // VALIDE ou DEJA_SCANNE
    @Column(nullable = false)
    private String statut;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime d) { this.dateValidation = d; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
