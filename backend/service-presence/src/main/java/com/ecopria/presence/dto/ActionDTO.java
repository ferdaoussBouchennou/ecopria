package com.ecopria.presence.dto;


public class ActionDTO {
    private Long id;
    private Integer points;
    private Double latitude;
    private Double longitude;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
