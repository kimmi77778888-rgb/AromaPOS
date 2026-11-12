package com.example.demo.model;

import java.time.LocalDateTime;

public class AuditLog {
    private String id;
    private LocalDateTime timestamp;
    private String userId;
    private String userName;
    private String userRole;
    private String action; // VOID_ITEM, DISCOUNT_OVERRIDE, SHIFT_CLOSE, REFUND_PROCESSED, DRAWER_KICK
    private String details;
    private String authorizedBy;
    private double amount;
    private String ipAddress;
    private String deviceInfo;
    private String loginMethod;
    private String location;

    public AuditLog() {
        this.timestamp = LocalDateTime.now();
    }

    public AuditLog(String id, String userId, String userName, String userRole, String action, String details, String authorizedBy, double amount) {
        this.id = id;
        this.timestamp = LocalDateTime.now();
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.action = action;
        this.details = details;
        this.authorizedBy = authorizedBy;
        this.amount = amount;
    }

    public AuditLog(String id, String userId, String userName, String userRole, String action, String details, String authorizedBy, double amount, String ipAddress, String deviceInfo, String loginMethod) {
        this(id, userId, userName, userRole, action, details, authorizedBy, amount, ipAddress, deviceInfo, loginMethod, null);
    }

    public AuditLog(String id, String userId, String userName, String userRole, String action, String details, String authorizedBy, double amount, String ipAddress, String deviceInfo, String loginMethod, String location) {
        this.id = id;
        this.timestamp = LocalDateTime.now();
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.action = action;
        this.details = details;
        this.authorizedBy = authorizedBy;
        this.amount = amount;
        this.ipAddress = ipAddress;
        this.deviceInfo = deviceInfo;
        this.loginMethod = loginMethod;
        this.location = location;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getAuthorizedBy() {
        return authorizedBy;
    }

    public void setAuthorizedBy(String authorizedBy) {
        this.authorizedBy = authorizedBy;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getLoginMethod() {
        return loginMethod;
    }

    public void setLoginMethod(String loginMethod) {
        this.loginMethod = loginMethod;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
