package com.example.demo.model;

import java.util.List;
import java.util.Map;

public class ReportSummary {
    // Sales KPIs
    private double grossSales;
    private double netSales;
    private double totalDiscounts;
    private double totalTax;
    private int customerCount;
    private double averageSpendPerGuest;

    // Charts & breakdowns
    private List<Map<String, Object>> peakHourData;
    private Map<String, Double> paymentBreakdown;
    private List<Map<String, Object>> topSellingItems;
    private List<Map<String, Object>> worstSellingItems;
    private List<Map<String, Object>> allProductPerformance;

    // COGS & Profitability
    private double overallCogsPercentage;
    private double totalIngredientCost;
    private double totalGrossProfit;
    private List<Map<String, Object>> itemProfitability;
    private List<Map<String, Object>> reorderForecast;

    // Staff Performance
    private List<Map<String, Object>> staffPerformance;
    private double storeLaborCostPercentage;

    // Active Filter Metadata
    private Map<String, Object> filterMetadata;

    public ReportSummary() {
    }

    public double getGrossSales() {
        return grossSales;
    }

    public void setGrossSales(double grossSales) {
        this.grossSales = grossSales;
    }

    public double getNetSales() {
        return netSales;
    }

    public void setNetSales(double netSales) {
        this.netSales = netSales;
    }

    public double getTotalDiscounts() {
        return totalDiscounts;
    }

    public void setTotalDiscounts(double totalDiscounts) {
        this.totalDiscounts = totalDiscounts;
    }

    public double getTotalTax() {
        return totalTax;
    }

    public void setTotalTax(double totalTax) {
        this.totalTax = totalTax;
    }

    public int getCustomerCount() {
        return customerCount;
    }

    public void setCustomerCount(int customerCount) {
        this.customerCount = customerCount;
    }

    public double getAverageSpendPerGuest() {
        return averageSpendPerGuest;
    }

    public void setAverageSpendPerGuest(double averageSpendPerGuest) {
        this.averageSpendPerGuest = averageSpendPerGuest;
    }

    public List<Map<String, Object>> getPeakHourData() {
        return peakHourData;
    }

    public void setPeakHourData(List<Map<String, Object>> peakHourData) {
        this.peakHourData = peakHourData;
    }

    public Map<String, Double> getPaymentBreakdown() {
        return paymentBreakdown;
    }

    public void setPaymentBreakdown(Map<String, Double> paymentBreakdown) {
        this.paymentBreakdown = paymentBreakdown;
    }

    public List<Map<String, Object>> getTopSellingItems() {
        return topSellingItems;
    }

    public void setTopSellingItems(List<Map<String, Object>> topSellingItems) {
        this.topSellingItems = topSellingItems;
    }

    public List<Map<String, Object>> getWorstSellingItems() {
        return worstSellingItems;
    }

    public void setWorstSellingItems(List<Map<String, Object>> worstSellingItems) {
        this.worstSellingItems = worstSellingItems;
    }

    public List<Map<String, Object>> getAllProductPerformance() {
        return allProductPerformance != null ? allProductPerformance : (topSellingItems != null ? topSellingItems : java.util.Collections.emptyList());
    }

    public void setAllProductPerformance(List<Map<String, Object>> allProductPerformance) {
        this.allProductPerformance = allProductPerformance;
    }

    public double getOverallCogsPercentage() {
        return overallCogsPercentage;
    }

    public void setOverallCogsPercentage(double overallCogsPercentage) {
        this.overallCogsPercentage = overallCogsPercentage;
    }

    public double getTotalIngredientCost() {
        return totalIngredientCost;
    }

    public void setTotalIngredientCost(double totalIngredientCost) {
        this.totalIngredientCost = totalIngredientCost;
    }

    public double getTotalGrossProfit() {
        return totalGrossProfit;
    }

    public void setTotalGrossProfit(double totalGrossProfit) {
        this.totalGrossProfit = totalGrossProfit;
    }

    public List<Map<String, Object>> getItemProfitability() {
        return itemProfitability;
    }

    public void setItemProfitability(List<Map<String, Object>> itemProfitability) {
        this.itemProfitability = itemProfitability;
    }

    public List<Map<String, Object>> getReorderForecast() {
        return reorderForecast;
    }

    public void setReorderForecast(List<Map<String, Object>> reorderForecast) {
        this.reorderForecast = reorderForecast;
    }

    public List<Map<String, Object>> getStaffPerformance() {
        return staffPerformance;
    }

    public void setStaffPerformance(List<Map<String, Object>> staffPerformance) {
        this.staffPerformance = staffPerformance;
    }

    public double getStoreLaborCostPercentage() {
        return storeLaborCostPercentage;
    }

    public void setStoreLaborCostPercentage(double storeLaborCostPercentage) {
        this.storeLaborCostPercentage = storeLaborCostPercentage;
    }

    public Map<String, Object> getFilterMetadata() {
        return filterMetadata;
    }

    public void setFilterMetadata(Map<String, Object> filterMetadata) {
        this.filterMetadata = filterMetadata;
    }
}
