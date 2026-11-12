package com.example.demo.model;

import java.time.LocalDateTime;

public class DeviceTravelBreadcrumb {
    private String id;
    private String userId;
    private String userName;
    private String userRole;
    private String deviceId;
    private String deviceInfo;
    private String ipAddress;
    private String location;
    private Double latitude;
    private Double longitude;
    private Double accuracyMeters;
    private Double speedKmh;
    private String isp;
    private String activity; // LOGIN, MOVING, CHECKPOINT, HANDOVER
    private LocalDateTime timestamp;

    public DeviceTravelBreadcrumb() {
        this.timestamp = LocalDateTime.now();
    }

    public DeviceTravelBreadcrumb(String id, String userId, String userName, String userRole, String deviceId, String deviceInfo, String ipAddress, String location, Double latitude, Double longitude, Double accuracyMeters, Double speedKmh, String isp, String activity) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.deviceId = deviceId;
        this.deviceInfo = deviceInfo;
        this.ipAddress = ipAddress;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracyMeters = accuracyMeters != null ? accuracyMeters : 10.0;
        this.speedKmh = speedKmh != null ? speedKmh : 0.0;
        this.isp = isp;
        this.activity = activity != null ? activity : "LOGIN";
        this.timestamp = LocalDateTime.now();
    }

    public DeviceTravelBreadcrumb(String id, String userId, String userName, String userRole, String deviceId, String deviceInfo, String ipAddress, String location, Double latitude, Double longitude, Double accuracyMeters, Double speedKmh, String isp, String activity, LocalDateTime timestamp) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.deviceId = deviceId;
        this.deviceInfo = deviceInfo;
        this.ipAddress = ipAddress;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracyMeters = accuracyMeters != null ? accuracyMeters : 10.0;
        this.speedKmh = speedKmh != null ? speedKmh : 0.0;
        this.isp = isp;
        this.activity = activity != null ? activity : "LOGIN";
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getAccuracyMeters() {
        return accuracyMeters;
    }

    public void setAccuracyMeters(Double accuracyMeters) {
        this.accuracyMeters = accuracyMeters;
    }

    public Double getSpeedKmh() {
        return speedKmh;
    }

    public void setSpeedKmh(Double speedKmh) {
        this.speedKmh = speedKmh;
    }

    public String getIsp() {
        return isp;
    }

    public void setIsp(String isp) {
        this.isp = isp;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
