package com.ecopria.inscription.dto;

public class InscriptionRequestDTO {
    private Long userId;
    private Long actionId;
    private Integer accompagnants;
    private String motivation;
    private String conditions;
    private Boolean imageRights;
    private Boolean newsletter;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String city;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public Integer getAccompagnants() { return accompagnants; }
    public void setAccompagnants(Integer accompagnants) { this.accompagnants = accompagnants; }
    public String getMotivation() { return motivation; }
    public void setMotivation(String motivation) { this.motivation = motivation; }
    public String getConditions() { return conditions; }
    public void setConditions(String conditions) { this.conditions = conditions; }
    public Boolean getImageRights() { return imageRights; }
    public void setImageRights(Boolean imageRights) { this.imageRights = imageRights; }
    public Boolean getNewsletter() { return newsletter; }
    public void setNewsletter(Boolean newsletter) { this.newsletter = newsletter; }
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
}