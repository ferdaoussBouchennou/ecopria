package com.ecopria.inscription.client.dto;

import java.time.LocalDateTime;

public class ActionDetailResponse {
    private Long id;
    private String title;
    private Integer availablePlaces;
    private Integer maxParticipants;
    private Integer points;
    private String status;
    private String city;
    private String address;
    private Long associationId;
    private LocalDateTime dateStart;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getAvailablePlaces() { return availablePlaces; }
    public void setAvailablePlaces(Integer availablePlaces) { this.availablePlaces = availablePlaces; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Long getAssociationId() { return associationId; }
    public void setAssociationId(Long associationId) { this.associationId = associationId; }
    public LocalDateTime getDateStart() { return dateStart; }
    public void setDateStart(LocalDateTime dateStart) { this.dateStart = dateStart; }
}
