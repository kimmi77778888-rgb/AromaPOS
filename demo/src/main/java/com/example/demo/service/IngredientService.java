package com.example.demo.service;

import com.example.demo.model.Ingredient;
import com.example.demo.model.RecipeItem;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IngredientService {
    private final Map<String, Ingredient> ingredientMap = new ConcurrentHashMap<>();

    public IngredientService() {
        initDefaultIngredients();
    }

    private void initDefaultIngredients() {
        List<Ingredient> defaults = List.of(
            new Ingredient("ing-1", "House Espresso Blend Beans", "g", 3200, 500, 0.03),
            new Ingredient("ing-2", "Ethiopian Guji Heirloom Beans", "g", 2400, 400, 0.04),
            new Ingredient("ing-3", "Organic Whole Milk", "ml", 6000, 1000, 0.003),
            new Ingredient("ing-4", "Barista Edition Oat Milk", "ml", 5000, 800, 0.005),
            new Ingredient("ing-5", "Artisan Almond Frangipane", "pcs", 14, 4, 1.80),
            new Ingredient("ing-6", "Cardamom Brioche Knots", "pcs", 12, 4, 1.50),
            new Ingredient("ing-7", "Dark Brown Sugar Syrup", "ml", 1800, 300, 0.015),
            new Ingredient("ing-8", "Madagascar Vanilla Syrup", "ml", 1400, 250, 0.018),
            new Ingredient("ing-9", "Salted Caramel Sauce", "ml", 950, 200, 0.02),
            new Ingredient("ing-10", "Ceremonial Uji Matcha Powder", "g", 650, 120, 0.12),
            new Ingredient("ing-11", "Compostable Hot Cups (12oz)", "cups", 180, 30, 0.08),
            new Ingredient("ing-12", "Cold Beverage Cups (16oz)", "cups", 160, 30, 0.10)
        );

        for (Ingredient ing : defaults) {
            ingredientMap.put(ing.getId(), ing);
        }
    }

    public List<Ingredient> getAllIngredients() {
        return new ArrayList<>(ingredientMap.values());
    }

    public Optional<Ingredient> getIngredientById(String id) {
        return Optional.ofNullable(ingredientMap.get(id));
    }

    public synchronized Ingredient restockIngredient(String id, double delta) {
        Ingredient ing = ingredientMap.get(id);
        if (ing != null) {
            ing.setStock(Math.max(0, Math.round((ing.getStock() + delta) * 100.0) / 100.0));
            return ing;
        }
        return null;
    }

    public synchronized boolean hasSufficientStock(List<RecipeItem> recipe, int quantity) {
        if (recipe == null || recipe.isEmpty()) return true;
        for (RecipeItem item : recipe) {
            Ingredient ing = ingredientMap.get(item.getIngredientId());
            if (ing == null || ing.getStock() < (item.getQuantity() * quantity)) {
                return false;
            }
        }
        return true;
    }

    public synchronized String getDepletedIngredientName(List<RecipeItem> recipe) {
        if (recipe == null) return null;
        for (RecipeItem item : recipe) {
            Ingredient ing = ingredientMap.get(item.getIngredientId());
            if (ing == null || ing.getStock() < item.getQuantity()) {
                return ing != null ? ing.getName() : "Raw material";
            }
        }
        return null;
    }

    public synchronized void deductForRecipe(List<RecipeItem> recipe, int quantity) {
        if (recipe == null) return;
        for (RecipeItem item : recipe) {
            Ingredient ing = ingredientMap.get(item.getIngredientId());
            if (ing != null) {
                double needed = item.getQuantity() * quantity;
                ing.setStock(Math.max(0, Math.round((ing.getStock() - needed) * 100.0) / 100.0));
            }
        }
    }

    public List<Ingredient> getLowStockIngredients() {
        return ingredientMap.values().stream()
                .filter(Ingredient::isLowStock)
                .toList();
    }
}
