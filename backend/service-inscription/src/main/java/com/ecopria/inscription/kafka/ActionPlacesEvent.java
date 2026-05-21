package com.ecopria.inscription.kafka;

public class ActionPlacesEvent {
    private Long actionId;
    private int placesDisponibles;
    private int placesTotal;

    public ActionPlacesEvent() {}

    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public int getPlacesDisponibles() { return placesDisponibles; }
    public void setPlacesDisponibles(int p) { this.placesDisponibles = p; }
    public int getPlacesTotal() { return placesTotal; }
    public void setPlacesTotal(int p) { this.placesTotal = p; }
}