package com.example.demo.model;

import java.time.LocalDateTime;

public class LoginSession {
    private String id;
    private String userId;
    private String userName;
    private String userRole;
    private String userAvatar;
    private String ipAddress;
    private String ipType;
    private String ipLabel;
    private String deviceType; // Phone, Tablet, Desktop, POS Touch Station
    private String deviceModel;
    private String brand; // Apple, Samsung, Google, Xiaomi, Microsoft, etc.
    private String os;
    private String browser;
    private String screen;
    private String terminalId;
    private String location;
    private String city;
    private String country;
    private String countryCode;
    private String flag;
    private Double latitude;
    private Double longitude;
    private String isp;
    private String mapsUrl;
    private String loginMethod; // PASSWORD, PIN, FACE_BIOMETRIC, SCREEN_UNLOCK
    private String status; // ACTIVE, CLOSED
    private String timestamp;
    private String lastActive;

    public LoginSession() {
        this.status = "ACTIVE";
        this.brand = "Universal Device";
        this.timestamp = LocalDateTime.now().toString();
        this.lastActive = LocalDateTime.now().toString();
    }

    private static String deriveBrand(String model, String os) {
        String s = ((model != null ? model : "") + " " + (os != null ? os : "")).toLowerCase();
        if (s.contains("iphone") || s.contains("ipad") || s.contains("apple") || s.contains("mac") || s.contains("ios")) return "Apple";
        if (s.contains("samsung") || s.contains("galaxy")) return "Samsung";
        if (s.contains("pixel") || s.contains("google")) return "Google";
        if (s.contains("xiaomi") || s.contains("redmi") || s.contains("poco")) return "Xiaomi";
        if (s.contains("oppo")) return "OPPO";
        if (s.contains("vivo")) return "vivo";
        if (s.contains("huawei") || s.contains("honor")) return "Huawei";
        if (s.contains("sunmi") || s.contains("pos") || s.contains("kiosk")) return "Sunmi POS";
        if (s.contains("dell")) return "Dell";
        if (s.contains("hp") || s.contains("hewlett")) return "HP";
        if (s.contains("lenovo") || s.contains("thinkpad")) return "Lenovo";
        if (s.contains("asus") || s.contains("zenfone")) return "ASUS";
        if (s.contains("windows")) return "Microsoft Windows";
        if (s.contains("linux")) return "Linux Workstation";
        return "Universal Device";
    }

    public LoginSession(String id, String userId, String userName, String userRole, String userAvatar, String ipAddress, String ipType, String ipLabel, String deviceType, String deviceModel, String os, String browser, String screen, String terminalId, String location, String city, String country, String countryCode, String flag, Double latitude, Double longitude, String isp, String mapsUrl, String loginMethod, String status, String timestamp, String lastActive) {
        this(id, userId, userName, userRole, userAvatar, ipAddress, ipType, ipLabel, deviceType, deviceModel, deriveBrand(deviceModel, os), os, browser, screen, terminalId, location, city, country, countryCode, flag, latitude, longitude, isp, mapsUrl, loginMethod, status, timestamp, lastActive);
    }

    public LoginSession(String id, String userId, String userName, String userRole, String userAvatar, String ipAddress, String ipType, String ipLabel, String deviceType, String deviceModel, String brand, String os, String browser, String screen, String terminalId, String location, String city, String country, String countryCode, String flag, Double latitude, Double longitude, String isp, String mapsUrl, String loginMethod, String status, String timestamp, String lastActive) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.userAvatar = userAvatar;
        this.ipAddress = ipAddress;
        this.ipType = ipType != null ? ipType : "IPv4";
        this.ipLabel = ipLabel != null ? ipLabel : "Public IPv4";
        this.deviceType = deviceType != null ? deviceType : "Desktop";
        this.deviceModel = deviceModel;
        this.brand = brand != null && !brand.isBlank() ? brand : deriveBrand(deviceModel, os);
        this.os = os;
        this.browser = browser;
        this.screen = screen;
        this.terminalId = terminalId;
        this.location = location;
        this.city = city != null ? city : "Phnom Penh";
        this.country = country != null ? country : "Cambodia";
        this.countryCode = countryCode != null ? countryCode : "KH";
        this.flag = flag != null ? flag : "🇰🇭";
        this.latitude = latitude != null ? latitude : 11.5564;
        this.longitude = longitude != null ? longitude : 104.9282;
        this.isp = isp;
        this.mapsUrl = mapsUrl != null ? mapsUrl : "https://www.google.com/maps?q=11.5564,104.9282";
        this.loginMethod = loginMethod != null ? loginMethod : "PASSWORD";
        this.status = status != null ? status : "ACTIVE";
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now().toString();
        this.lastActive = lastActive != null ? lastActive : LocalDateTime.now().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getUserAvatar() { return userAvatar; }
    public void setUserAvatar(String userAvatar) { this.userAvatar = userAvatar; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getIpType() { return ipType; }
    public void setIpType(String ipType) { this.ipType = ipType; }

    public String getIpLabel() { return ipLabel; }
    public void setIpLabel(String ipLabel) { this.ipLabel = ipLabel; }

    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

    public String getDeviceModel() { return deviceModel; }
    public void setDeviceModel(String deviceModel) { this.deviceModel = deviceModel; }

    public String getBrand() {
        if (brand != null && !brand.isBlank()) return brand;
        return deriveBrand(deviceModel, os);
    }
    public void setBrand(String brand) { this.brand = brand; }

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }

    public String getBrowser() { return browser; }
    public void setBrowser(String browser) { this.browser = browser; }

    public String getScreen() { return screen; }
    public void setScreen(String screen) { this.screen = screen; }

    public String getTerminalId() { return terminalId; }
    public void setTerminalId(String terminalId) { this.terminalId = terminalId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getFlag() { return flag; }
    public void setFlag(String flag) { this.flag = flag; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getIsp() { return isp; }
    public void setIsp(String isp) { this.isp = isp; }

    public String getMapsUrl() { return mapsUrl; }
    public void setMapsUrl(String mapsUrl) { this.mapsUrl = mapsUrl; }

    public String getLoginMethod() { return loginMethod; }
    public void setLoginMethod(String loginMethod) { this.loginMethod = loginMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getLastActive() { return lastActive; }
    public void setLastActive(String lastActive) { this.lastActive = lastActive; }
}

