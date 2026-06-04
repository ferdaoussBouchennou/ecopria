package com.ecopria.presence.dto;

import java.util.Map;

public class PointsByActionsDTO {
    private long total;
    private Map<Long, Integer> byAction;

    public PointsByActionsDTO() {
    }

    public PointsByActionsDTO(long total, Map<Long, Integer> byAction) {
        this.total = total;
        this.byAction = byAction;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public Map<Long, Integer> getByAction() {
        return byAction;
    }

    public void setByAction(Map<Long, Integer> byAction) {
        this.byAction = byAction;
    }
}
