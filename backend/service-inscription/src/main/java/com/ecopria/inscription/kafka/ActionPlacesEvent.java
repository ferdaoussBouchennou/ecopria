package com.ecopria.inscription.kafka;

import com.fasterxml.jackson.annotation.JsonAlias;

public class ActionPlacesEvent {
    private Long actionId;
    private Integer availablePlaces;
    private Integer maxParticipants;

    public ActionPlacesEvent() {}

    public Long getActionId() { return actionId; }
    public void setActionId(Long actionId) { this.actionId = actionId; }

    public Integer getAvailablePlaces() { return availablePlaces; }
    @JsonAlias({"placesDisponibles"})
    public void setAvailablePlaces(Integer availablePlaces) { this.availablePlaces = availablePlaces; }

    public Integer getMaxParticipants() { return maxParticipants; }
    @JsonAlias({"placesTotal"})
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
}