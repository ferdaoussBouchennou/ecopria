package com.ecopria.presence.dto;

public class ValidationByPinDTO {
    private String pinCode;
    private Long userId;

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
