package com.example.demo.service;

import com.example.demo.model.Product;
import com.example.demo.model.RecipeItem;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ProductService {
    private final IngredientService ingredientService;
    private final Map<String, Product> productMap = new ConcurrentHashMap<>();
    private final AtomicInteger idCounter = new AtomicInteger(100);

    public ProductService(IngredientService ingredientService) {
        this.ingredientService = ingredientService;
        initDefaultProducts();
    }

    private void initDefaultProducts() {
        // Product 1: Artisan Pour Over (18g Ethiopian Beans, 1 Hot Cup)
        Product p1 = new Product("prod-1", "Artisan Pour Over", "Hot Coffee", 4.75, 18, 
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80",
            "Single-origin Ethiopian beans with floral jasmine & citrus notes", "SKU-HCF-001");
        p1.setRecipe(List.of(
            new RecipeItem("ing-2", "Ethiopian Guji Heirloom Beans", 18.0, "g"),
            new RecipeItem("ing-11", "Compostable Hot Cups (12oz)", 1.0, "cups")
        ));
        productMap.put(p1.getId(), p1);

        // Product 2: Velvety Flat White (18g Espresso Beans, 180ml Whole Milk, 1 Hot Cup)
        Product p2 = new Product("prod-2", "Velvety Flat White", "Hot Coffee", 4.50, 14, 
            "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=500&q=80",
            "Double ristretto with micro-foamed whole milk and silky latte art", "SKU-HCF-002");
        p2.setRecipe(List.of(
            new RecipeItem("ing-1", "House Espresso Blend Beans", 18.0, "g"),
            new RecipeItem("ing-3", "Organic Whole Milk", 180.0, "ml"),
            new RecipeItem("ing-11", "Compostable Hot Cups (12oz)", 1.0, "cups")
        ));
        productMap.put(p2.getId(), p2);

        // Product 3: Caramel Brulee Macchiato (18g Espresso, 160ml Milk, 25ml Caramel, 1 Hot Cup)
        Product p3 = new Product("prod-3", "Caramel Brulee Macchiato", "Hot Coffee", 5.25, 4, 
            "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80",
            "Steamed vanilla milk marked with espresso & salted caramel drizzle", "SKU-HCF-003");
        p3.setRecipe(List.of(
            new RecipeItem("ing-1", "House Espresso Blend Beans", 18.0, "g"),
            new RecipeItem("ing-3", "Organic Whole Milk", 160.0, "ml"),
            new RecipeItem("ing-9", "Salted Caramel Sauce", 25.0, "ml"),
            new RecipeItem("ing-11", "Compostable Hot Cups (12oz)", 1.0, "cups")
        ));
        productMap.put(p3.getId(), p3);

        // Product 4: Smoked Spanish Cortado (18g Espresso, 90ml Milk, 1 Hot Cup)
        Product p4 = new Product("prod-4", "Smoked Spanish Cortado", "Hot Coffee", 4.25, 12, 
            "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80",
            "Equal parts bold espresso and warm textured milk served in a Gibraltar glass", "SKU-HCF-004");
        p4.setRecipe(List.of(
            new RecipeItem("ing-1", "House Espresso Blend Beans", 18.0, "g"),
            new RecipeItem("ing-3", "Organic Whole Milk", 90.0, "ml"),
            new RecipeItem("ing-11", "Compostable Hot Cups (12oz)", 1.0, "cups")
        ));
        productMap.put(p4.getId(), p4);

        // Product 5: Nitro Cold Brew Reserve (25g Espresso Blend, 1 Cold Cup)
        Product p5 = new Product("prod-5", "Nitro Cold Brew Reserve", "Iced Coffee", 5.50, 8, 
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80",
            "Slow-steeped for 20 hours and infused with nitrogen for a cascading creamy foam", "SKU-ICF-001");
        p5.setRecipe(List.of(
            new RecipeItem("ing-1", "House Espresso Blend Beans", 25.0, "g"),
            new RecipeItem("ing-12", "Cold Beverage Cups (16oz)", 1.0, "cups")
        ));
        productMap.put(p5.getId(), p5);

        // Product 6: Iced Brown Sugar Oat Shaken (18g Espresso, 200ml Oat Milk, 30ml Brown Sugar Syrup, 1 Cold Cup)
        Product p6 = new Product("prod-6", "Iced Brown Sugar Oat Shaken", "Iced Coffee", 5.75, 3, 
            "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=500&q=80",
            "Blonde espresso shaken with brown sugar, Ceylon cinnamon, topped with oat milk", "SKU-ICF-002");
        p6.setRecipe(List.of(
            new RecipeItem("ing-1", "House Espresso Blend Beans", 18.0, "g"),
            new RecipeItem("ing-4", "Barista Edition Oat Milk", 200.0, "ml"),
            new RecipeItem("ing-7", "Dark Brown Sugar Syrup", 30.0, "ml"),
            new RecipeItem("ing-12", "Cold Beverage Cups (16oz)", 1.0, "cups")
        ));
        productMap.put(p6.getId(), p6);

        // Product 9: Flaky Almond Croissant (1 Pastry piece)
        Product p9 = new Product("prod-9", "Flaky Almond Croissant", "Pastries", 4.50, 2, 
            "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80",
            "Twice-baked French butter croissant filled with frangipane almond cream", "SKU-PST-001");
        p9.setRecipe(List.of(
            new RecipeItem("ing-5", "Artisan Almond Frangipane", 1.0, "pcs")
        ));
        productMap.put(p9.getId(), p9);

        // Product 10: Cardamom Cinnamon Swirl (1 Pastry piece)
        Product p10 = new Product("prod-10", "Cardamom Cinnamon Swirl", "Pastries", 4.25, 9, 
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
            "Swedish bullar knot with fresh ground cardamom and pearl sugar", "SKU-PST-002");
        p10.setRecipe(List.of(
            new RecipeItem("ing-6", "Cardamom Brioche Knots", 1.0, "pcs")
        ));
        productMap.put(p10.getId(), p10);

        // Product 16: Ceremonial Uji Matcha Latte (6g Matcha, 220ml Oat Milk, 1 Hot Cup)
        Product p16 = new Product("prod-16", "Ceremonial Uji Matcha Latte", "Specialty", 5.75, 10, 
            "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=500&q=80",
            "First-harvest Japanese stone-ground green tea whisked with creamy oat milk", "SKU-SPC-001");
        p16.setRecipe(List.of(
            new RecipeItem("ing-10", "Ceremonial Uji Matcha Powder", 6.0, "g"),
            new RecipeItem("ing-4", "Barista Edition Oat Milk", 220.0, "ml"),
            new RecipeItem("ing-11", "Compostable Hot Cups (12oz)", 1.0, "cups")
        ));
        productMap.put(p16.getId(), p16);
    }

    public List<Product> getAllProducts() {
        // Dynamically compute auto-disabling state based on raw ingredient levels
        for (Product product : productMap.values()) {
            if (product.getStock() <= 0) {
                product.setAutoDisabled(true);
                product.setDisabledReason("Finished Stock");
            } else if (!ingredientService.hasSufficientStock(product.getRecipe(), 1)) {
                String missing = ingredientService.getDepletedIngredientName(product.getRecipe());
                product.setAutoDisabled(true);
                product.setDisabledReason("Missing: " + (missing != null ? missing : "Ingredients"));
            } else {
                product.setAutoDisabled(false);
                product.setDisabledReason("");
            }
        }
        return new ArrayList<>(productMap.values());
    }

    public Optional<Product> getProductById(String id) {
        return Optional.ofNullable(productMap.get(id));
    }

    public synchronized Product addProduct(Product product) {
        if (product.getId() == null || product.getId().isBlank()) {
            product.setId("prod-" + idCounter.incrementAndGet());
        }
        if (product.getSku() == null || product.getSku().isBlank()) {
            product.setSku("SKU-" + (int)(Math.random() * 9000 + 1000));
        }
        if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
            product.setImageUrl("https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=500&q=80");
        }
        productMap.put(product.getId(), product);
        return product;
    }

    public synchronized Optional<Product> updateProduct(String id, Product updated) {
        if (!productMap.containsKey(id)) {
            return Optional.empty();
        }
        Product existing = productMap.get(id);
        existing.setName(updated.getName());
        existing.setCategory(updated.getCategory());
        existing.setPrice(updated.getPrice());
        existing.setStock(updated.getStock());
        if (updated.getImageUrl() != null && !updated.getImageUrl().isBlank()) {
            existing.setImageUrl(updated.getImageUrl());
        }
        if (updated.getDescription() != null) {
            existing.setDescription(updated.getDescription());
        }
        if (updated.getRecipe() != null && !updated.getRecipe().isEmpty()) {
            existing.setRecipe(updated.getRecipe());
        }
        return Optional.of(existing);
    }

    public synchronized Optional<Product> updateStock(String id, int delta) {
        Product product = productMap.get(id);
        if (product == null) {
            return Optional.empty();
        }
        int newStock = Math.max(0, product.getStock() + delta);
        product.setStock(newStock);
        return Optional.of(product);
    }

    public synchronized boolean deductStock(String id, int quantity) {
        Product product = productMap.get(id);
        if (product == null || product.getStock() < quantity) {
            return false;
        }
        product.setStock(product.getStock() - quantity);
        return true;
    }

    public synchronized boolean deleteProduct(String id) {
        return productMap.remove(id) != null;
    }

    public List<Product> getLowStockProducts() {
        return getAllProducts().stream()
                .filter(Product::isLowStock)
                .toList();
    }
}
