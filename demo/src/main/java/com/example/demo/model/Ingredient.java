package com.example.demo.model;

public class Ingredient {
    private String id;
    private String name;
    private String unit; // "g", "ml", "pcs", "cups"
    private double stock;
    private double minThreshold;
    private double costPerUnit;

    public Ingredient() {
    }

    public Ingredient(String id, String name, String unit, double stock, double minThreshold, double costPerUnit) {
        this.id = id;
        this.name = name;
        this.unit = unit;
        this.stock = stock;
        this.minThreshold = minThreshold;
        this.costPerUnit = costPerUnit;
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public double getStock() {
        return stock;
    }

    public void setStock(double stock) {
        this.stock = stock;
    }

    public double getMinThreshold() {
        return minThreshold;
    }

    public void setMinThreshold(double minThreshold) {
        this.minThreshold = minThreshold;
    }

    public double getCostPerUnit() {
        return costPerUnit;
    }

    public void setCostPerUnit(double costPerUnit) {
        this.costPerUnit = costPerUnit;
    }

    public boolean isLowStock() {
        return stock > 0 && stock <= minThreshold;
    }

    public boolean isOutOfStock() {
        return stock <= 0;
    }
}
