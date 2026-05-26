package com.ecopria.inscription.client.dto;

/**
 * Miroir de {@code com.ecopria.action.dto.ActionAvailabilityDTO}
 * pour les appels via API Gateway → service-action.
 */
public class ActionAvailabilityResponse {
    private Long actionId;
    private Integer availablePlaces;
    private Integer maxParticipants;
    private Integer points;
    private String status;
    private Boolean hasAvailablePlaces;

    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }
    public Integer getAvailablePlaces() { return availablePlaces; }
    public void setAvailablePlaces(Integer availablePlaces) { this.availablePlaces = availablePlaces; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getHasAvailablePlaces() { return hasAvailablePlaces; }
    public void setHasAvailablePlaces(Boolean hasAvailablePlaces) { this.hasAvailablePlaces = hasAvailablePlaces; }
}
