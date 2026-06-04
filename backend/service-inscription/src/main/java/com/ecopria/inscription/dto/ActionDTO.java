package com.ecopria.inscription.dto;

public class ActionDTO {
    private Long id;
    private String titre;
    private int placesDisponibles;
    private int placesTotales;
    private int points;
    private String statut;
    private String city;
    private String address;
    private Long associationId;
    private String dateStart;
    private Long associationUserId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public int getPlacesDisponibles() { return placesDisponibles; }
    public void setPlacesDisponibles(int p) { this.placesDisponibles = p; }
    public int getPlacesTotales() { return placesTotales; }
    public void setPlacesTotales(int p) { this.placesTotales = p; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Long getAssociationId() { return associationId; }
    public void setAssociationId(Long associationId) { this.associationId = associationId; }
    public String getDateStart() { return dateStart; }
    public void setDateStart(String dateStart) { this.dateStart = dateStart; }
    public Long getAssociationUserId() { return associationUserId; }
    public void setAssociationUserId(Long associationUserId) { this.associationUserId = associationUserId; }
}