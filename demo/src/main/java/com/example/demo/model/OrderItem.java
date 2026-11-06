package com.example.demo.model;

import java.util.HashMap;
import java.util.Map;

public class OrderItem {
    private String productId;
    private String productName;
    private double unitPrice;
    private int quantity;
    private double subtotal;
    private String notes;
    private String imageUrl;
    private Map<String, String> modifiers = new HashMap<>(); // e.g. "size": "Large (16oz)", "milk": "Oat Milk", "shots": "+1 Espresso Shot"

    public OrderItem() {
    }

    public OrderItem(String productId, String productName, double unitPrice, int quantity, double subtotal, String notes) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.subtotal = subtotal;
        this.notes = notes;
    }

    public OrderItem(String productId, String productName, double unitPrice, int quantity, double subtotal, String notes, String imageUrl) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.subtotal = subtotal;
        this.notes = notes;
        this.imageUrl = imageUrl;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Map<String, String> getModifiers() {
        return modifiers;
    }

    public void setModifiers(Map<String, String> modifiers) {
        this.modifiers = modifiers;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
