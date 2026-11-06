package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class Shift {
    private String id;
    private String shiftNumber;
    private String staffId;
    private String staffName;
    private String staffRole;
    private String registerName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String status; // "OPEN", "CLOSED"
    private double startingFloat;
    private double totalGrossSales;
    private double cashSales;
    private double cardSales;
    private double qrSales;
    private int totalOrders;
    private double refunds;
    private double expectedCash;
    private double actualCashCount;
    private double variance;
    private String varianceStatus; // "BALANCED", "OVERAGE", "SHORTAGE"
    private String closedBy;
    private String openingNotes;
    private String closingNotes;
    private double payIns = 0.0;
    private double payOuts = 0.0;
    private java.util.List<Map<String, Object>> cashMovements = new java.util.ArrayList<>();
    private Map<String, Object> denominations = new HashMap<>();

    public Shift() {
        this.openedAt = LocalDateTime.now();
        this.status = "OPEN";
    }

    public Shift(String id, String shiftNumber, String staffId, String staffName, String staffRole, 
                 String registerName, double startingFloat, String openingNotes) {
        this.id = id;
        this.shiftNumber = shiftNumber;
        this.staffId = staffId;
        this.staffName = staffName;
        this.staffRole = staffRole;
        this.registerName = registerName;
        this.startingFloat = startingFloat;
        this.openingNotes = openingNotes;
        this.openedAt = LocalDateTime.now();
        this.status = "OPEN";
        this.expectedCash = startingFloat;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getShiftNumber() { return shiftNumber; }
    public void setShiftNumber(String shiftNumber) { this.shiftNumber = shiftNumber; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public String getStaffRole() { return staffRole; }
    public void setStaffRole(String staffRole) { this.staffRole = staffRole; }

    public String getRegisterName() { return registerName; }
    public void setRegisterName(String registerName) { this.registerName = registerName; }

    public LocalDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getStartingFloat() { return startingFloat; }
    public void setStartingFloat(double startingFloat) { this.startingFloat = startingFloat; }

    public double getTotalGrossSales() { return totalGrossSales; }
    public void setTotalGrossSales(double totalGrossSales) { this.totalGrossSales = totalGrossSales; }

    public double getCashSales() { return cashSales; }
    public void setCashSales(double cashSales) { this.cashSales = cashSales; }

    public double getCardSales() { return cardSales; }
    public void setCardSales(double cardSales) { this.cardSales = cardSales; }

    public double getQrSales() { return qrSales; }
    public void setQrSales(double qrSales) { this.qrSales = qrSales; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public double getRefunds() { return refunds; }
    public void setRefunds(double refunds) { this.refunds = refunds; }

    public double getExpectedCash() { return expectedCash; }
    public void setExpectedCash(double expectedCash) { this.expectedCash = expectedCash; }

    public double getActualCashCount() { return actualCashCount; }
    public void setActualCashCount(double actualCashCount) { this.actualCashCount = actualCashCount; }

    public double getVariance() { return variance; }
    public void setVariance(double variance) { this.variance = variance; }

    public String getVarianceStatus() { return varianceStatus; }
    public void setVarianceStatus(String varianceStatus) { this.varianceStatus = varianceStatus; }

    public String getClosedBy() { return closedBy; }
    public void setClosedBy(String closedBy) { this.closedBy = closedBy; }

    public String getOpeningNotes() { return openingNotes; }
    public void setOpeningNotes(String openingNotes) { this.openingNotes = openingNotes; }

    public String getClosingNotes() { return closingNotes; }
    public void setClosingNotes(String closingNotes) { this.closingNotes = closingNotes; }

    public double getPayIns() { return payIns; }
    public void setPayIns(double payIns) { this.payIns = payIns; }

    public double getPayOuts() { return payOuts; }
    public void setPayOuts(double payOuts) { this.payOuts = payOuts; }

    public java.util.List<Map<String, Object>> getCashMovements() { return cashMovements; }
    public void setCashMovements(java.util.List<Map<String, Object>> cashMovements) { this.cashMovements = cashMovements; }

    public Map<String, Object> getDenominations() { return denominations; }
    public void setDenominations(Map<String, Object> denominations) { this.denominations = denominations; }
}
