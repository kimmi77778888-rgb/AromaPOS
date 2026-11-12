package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class User {
    private String id;
    private String name;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String pinCode; // 4-digit PIN for quick station handover & manager overrides
    private String role; // ADMIN, MANAGER, CASHIER, BARISTA
    private double hourlyRate;
    private String status; // ACTIVE, INACTIVE
    private String phone;
    private String avatar;
    private Boolean faceEnrolled = false;
    private String facePhoto;
    private String faceHash;
    private String faceBiometrics;
    private java.util.List<String> permissions = new java.util.ArrayList<>();
    private String lastLoginIp;
    private String lastLoginDevice;
    private String lastLoginLocation;
    private Double lastLoginLatitude;
    private Double lastLoginLongitude;
    private String lastLoginIsp;
    private String lastLoginAt;
    private String lastLoginMethod;

    public User() {
        this.status = "ACTIVE";
        this.faceEnrolled = false;
    }

    public User(String id, String name, String email, String password, String pinCode, String role, double hourlyRate, String status, String phone, String avatar) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.pinCode = pinCode;
        this.role = role;
        this.hourlyRate = hourlyRate;
        this.status = status != null ? status : "ACTIVE";
        this.phone = phone;
        this.avatar = avatar;
        this.faceEnrolled = false;
        this.facePhoto = null;
    }

    public User(String id, String name, String email, String password, String pinCode, String role, double hourlyRate, String status, String phone, String avatar, boolean faceEnrolled, java.util.List<String> permissions) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.pinCode = pinCode;
        this.role = role;
        this.hourlyRate = hourlyRate;
        this.status = status != null ? status : "ACTIVE";
        this.phone = phone;
        this.avatar = avatar;
        this.faceEnrolled = faceEnrolled;
        this.facePhoto = avatar;
        this.permissions = permissions != null ? permissions : new java.util.ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }

    public String getPin() {
        return pinCode;
    }

    public void setPin(String pin) {
        this.pinCode = pin;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public double getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Boolean getFaceEnrolled() {
        return faceEnrolled;
    }

    public boolean isFaceEnrolled() {
        return faceEnrolled != null && faceEnrolled;
    }

    public void setFaceEnrolled(Boolean faceEnrolled) {
        this.faceEnrolled = faceEnrolled;
    }

    public String getFacePhoto() {
        return facePhoto;
    }

    public void setFacePhoto(String facePhoto) {
        this.facePhoto = facePhoto;
    }

    public String getFaceHash() {
        return faceHash;
    }

    public void setFaceHash(String faceHash) {
        this.faceHash = faceHash;
    }

    public String getFaceBiometrics() {
        return faceBiometrics;
    }

    public void setFaceBiometrics(String faceBiometrics) {
        this.faceBiometrics = faceBiometrics;
    }

    public java.util.List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(java.util.List<String> permissions) {
        this.permissions = permissions;
    }

    public String getLastLoginIp() {
        return lastLoginIp;
    }

    public void setLastLoginIp(String lastLoginIp) {
        this.lastLoginIp = lastLoginIp;
    }

    public String getLastLoginDevice() {
        return lastLoginDevice;
    }

    public void setLastLoginDevice(String lastLoginDevice) {
        this.lastLoginDevice = lastLoginDevice;
    }

    public String getLastLoginLocation() {
        return lastLoginLocation;
    }

    public void setLastLoginLocation(String lastLoginLocation) {
        this.lastLoginLocation = lastLoginLocation;
    }

    public Double getLastLoginLatitude() {
        return lastLoginLatitude;
    }

    public void setLastLoginLatitude(Double lastLoginLatitude) {
        this.lastLoginLatitude = lastLoginLatitude;
    }

    public Double getLastLoginLongitude() {
        return lastLoginLongitude;
    }

    public void setLastLoginLongitude(Double lastLoginLongitude) {
        this.lastLoginLongitude = lastLoginLongitude;
    }

    public String getLastLoginIsp() {
        return lastLoginIsp;
    }

    public void setLastLoginIsp(String lastLoginIsp) {
        this.lastLoginIsp = lastLoginIsp;
    }

    public String getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(String lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getLastLoginMethod() {
        return lastLoginMethod;
    }

    public void setLastLoginMethod(String lastLoginMethod) {
        this.lastLoginMethod = lastLoginMethod;
    }
}
