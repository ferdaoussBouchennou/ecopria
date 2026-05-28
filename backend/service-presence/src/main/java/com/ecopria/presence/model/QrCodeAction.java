package com.ecopria.presence.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qrcodes_actions")
public class QrCodeAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // UN seul QR Code par action
    @Column(nullable = false, unique = true)
    private Long actionId;

    // Le token HMAC signé
    @Column(nullable = false, unique = true, length = 500)
    private String qrCode;

    // Code PIN à 6 chiffres pour validation manuelle
    @Column(nullable = false, length = 6)
    private String pinCode;

    // Points de l'action
    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime d) { this.dateCreation = d; }
}
