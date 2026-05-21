package com.ecopria.presence.kafka;



import java.time.LocalDateTime;

public class PresenceValideeEvent {
    private Long presenceId;
    private Long userId;
    private Long actionId;
    private Integer points;
    private LocalDateTime dateValidation;

    public PresenceValideeEvent() {}

    public PresenceValideeEvent(Long presenceId, Long userId, Long actionId,
                                Integer points, LocalDateTime dateValidation) {
        this.presenceId = presenceId;
        this.userId = userId;
        this.actionId = actionId;
        this.points = points;
        this.dateValidation = dateValidation;
    }

    public Long getPresenceId() { return presenceId; }
    public void setPresenceId(Long p) { this.presenceId = p; }
    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer p) { this.points = p; }
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime d) { this.dateValidation = d; }
}
