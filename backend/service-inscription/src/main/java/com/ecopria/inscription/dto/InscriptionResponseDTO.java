package com.ecopria.inscription.dto;

import java.time.LocalDateTime;

public class InscriptionResponseDTO {
    private Long id;
    private Long userId;
    private Long actionId;
    private LocalDateTime dateInscription;
    private String statut;
    private Integer pointsAction;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String city;
    private String photoUrl;

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
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
