package com.example.demo.model;

import java.util.List;
import java.util.Map;

public class DashboardStats {
    private double totalRevenue;
    private int totalOrders;
    private int lowStockCount;
    private double averageOrderValue;
    private List<Product> lowStockProducts;
    private List<Map<String, Object>> recentOrders;
    private List<Map<String, Object>> hourlySales;
    private List<Map<String, Object>> topSellingItems;
    private Map<String, Double> salesByCategory;

    public DashboardStats() {
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public int getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(int totalOrders) {
        this.totalOrders = totalOrders;
    }

    public int getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(int lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public double getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(double averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public List<Product> getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(List<Product> lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
    }

    public List<Map<String, Object>> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<Map<String, Object>> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public List<Map<String, Object>> getHourlySales() {
        return hourlySales;
    }

    public void setHourlySales(List<Map<String, Object>> hourlySales) {
        this.hourlySales = hourlySales;
    }

    public List<Map<String, Object>> getTopSellingItems() {
        return topSellingItems;
    }

    public void setTopSellingItems(List<Map<String, Object>> topSellingItems) {
        this.topSellingItems = topSellingItems;
    }

    public Map<String, Double> getSalesByCategory() {
        return salesByCategory;
    }

    public void setSalesByCategory(Map<String, Double> salesByCategory) {
        this.salesByCategory = salesByCategory;
    }
}
