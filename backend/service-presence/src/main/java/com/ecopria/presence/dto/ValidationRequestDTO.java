package com.ecopria.presence.dto;



public class ValidationRequestDTO {
    private String qrCode;
    private Long userId;

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
