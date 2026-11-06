package com.example.demo.model;

import java.util.ArrayList;
import java.util.List;

public class Product {
    private String id;
    private String name;
    private String nameKm;
    private String category; // "Hot Coffee", "Iced Coffee", "Pastries", "Beans", "Specialty"
    private String categoryKm;
    private double price;
    private int stock;
    private String imageUrl;
    private String description;
    private String sku;
    private List<RecipeItem> recipe = new ArrayList<>();
    private boolean autoDisabled = false;
    private String disabledReason = "";

    public Product() {
    }

    public Product(String id, String name, String category, double price, int stock, String imageUrl, String description, String sku) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.imageUrl = imageUrl;
        this.description = description;
        this.sku = sku;
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

    public String getNameKm() {
        return nameKm != null ? nameKm : name;
    }

    public void setNameKm(String nameKm) {
        this.nameKm = nameKm;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCategoryKm() {
        return categoryKm != null ? categoryKm : category;
    }

    public void setCategoryKm(String categoryKm) {
        this.categoryKm = categoryKm;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public List<RecipeItem> getRecipe() {
        return recipe;
    }

    public void setRecipe(List<RecipeItem> recipe) {
        this.recipe = recipe;
    }

    public boolean isAutoDisabled() {
        return autoDisabled || stock <= 0;
    }

    public void setAutoDisabled(boolean autoDisabled) {
        this.autoDisabled = autoDisabled;
    }

    public String getDisabledReason() {
        if (stock <= 0) return "Finished Stock";
        return disabledReason;
    }

    public void setDisabledReason(String disabledReason) {
        this.disabledReason = disabledReason;
    }

    public boolean isLowStock() {
        return stock > 0 && stock <= 5;
    }

    public boolean isOutOfStock() {
        return stock <= 0 || autoDisabled;
    }
}
