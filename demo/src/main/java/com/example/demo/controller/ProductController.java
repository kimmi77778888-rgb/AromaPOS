package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    private boolean isCashierOrBarista(String roleHeader, String roleParam) {
        String role = roleHeader != null ? roleHeader : roleParam;
        if (role == null) return false;
        String r = role.trim().toUpperCase();
        return "CASHIER".equals(r) || "BARISTA".equals(r);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable String id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> addProduct(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestBody Product product
    ) {
        if (isCashierOrBarista(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Cashiers and Baristas cannot create new menu items."
            ));
        }

        if (product.getName() == null || product.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Product name is required"));
        }
        if (product.getPrice() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Price must be greater than zero"));
        }
        Product saved = productService.addProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @PathVariable String id,
            @RequestBody Product product
    ) {
        if (isCashierOrBarista(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Cashiers and Baristas cannot edit menu items."
            ));
        }

        return productService.updateProduct(id, product)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/restock")
    public ResponseEntity<?> restockProduct(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @PathVariable String id,
            @RequestBody Map<String, Integer> payload
    ) {
        if (isCashierOrBarista(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Only Manager and Admin can restock products."
            ));
        }

        int delta = payload.getOrDefault("delta", 10);
        return productService.updateStock(id, delta)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @PathVariable String id
    ) {
        if (isCashierOrBarista(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Cashiers and Baristas cannot delete menu items."
            ));
        }

        boolean deleted = productService.deleteProduct(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
