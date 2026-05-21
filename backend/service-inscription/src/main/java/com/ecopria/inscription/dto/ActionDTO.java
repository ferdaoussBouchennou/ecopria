package com.ecopria.inscription.dto;

public class ActionDTO {
    private Long id;
    private String titre;
    private int placesDisponibles;
    private int placesTotales;
    private int points;
    private String statut;

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
}