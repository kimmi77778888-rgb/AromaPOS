package com.example.demo.controller;

import com.example.demo.model.Ingredient;
import com.example.demo.service.IngredientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ingredients")
public class IngredientController {
    private final IngredientService ingredientService;

    public IngredientController(IngredientService ingredientService) {
        this.ingredientService = ingredientService;
    }

    @GetMapping
    public ResponseEntity<List<Ingredient>> getAllIngredients() {
        return ResponseEntity.ok(ingredientService.getAllIngredients());
    }

    @PostMapping("/{id}/restock")
    public ResponseEntity<?> restockIngredient(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @PathVariable String id,
            @RequestBody Map<String, Double> payload
    ) {
        String activeRole = roleHeader != null ? roleHeader : role;
        if (activeRole != null && ("CASHIER".equalsIgnoreCase(activeRole) || "BARISTA".equalsIgnoreCase(activeRole))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Only Manager and Admin can adjust raw inventory counts."
            ));
        }

        double delta = payload.getOrDefault("delta", 500.0);
        Ingredient updated = ingredientService.restockIngredient(id, delta);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
