package com.ecopria.presence.kafka;



import java.time.LocalDateTime;

public class FraudeDetecteeEvent {
    private Long userId;
    private Long actionId;
    private String raison;
    private Integer tentatives;
    private LocalDateTime detecteLe;

    public FraudeDetecteeEvent() {}

    public FraudeDetecteeEvent(Long userId, Long actionId, String raison,
                               Integer tentatives, LocalDateTime detecteLe) {
        this.userId = userId;
        this.actionId = actionId;
        this.raison = raison;
        this.tentatives = tentatives;
        this.detecteLe = detecteLe;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long u) { this.userId = u; }
    public Long getActionId() { return actionId; }
    public void setActionId(Long a) { this.actionId = a; }
    public String getRaison() { return raison; }
    public void setRaison(String r) { this.raison = r; }
    public Integer getTentatives() { return tentatives; }
    public void setTentatives(Integer t) { this.tentatives = t; }
    public LocalDateTime getDetecteLe() { return detecteLe; }
    public void setDetecteLe(LocalDateTime d) { this.detecteLe = d; }
}
