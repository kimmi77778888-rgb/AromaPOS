package com.example.demo.controller;

import com.example.demo.model.Shift;
import com.example.demo.service.OrderService;
import com.example.demo.service.ShiftService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class ShiftController {

    private final ShiftService shiftService;
    private final OrderService orderService;

    public ShiftController(ShiftService shiftService, OrderService orderService) {
        this.shiftService = shiftService;
        this.orderService = orderService;
    }

    // --- REST APIs under /api/shifts ---

    @GetMapping("/api/shifts")
    public ResponseEntity<List<Shift>> getAllShifts() {
        return ResponseEntity.ok(shiftService.getAllShifts());
    }

    @GetMapping("/api/shifts/active")
    public ResponseEntity<?> getActiveShift() {
        return shiftService.getActiveShift()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/api/shifts/status")
    public ResponseEntity<Map<String, Object>> getStoreStatus() {
        boolean isOpen = shiftService.isStoreOpen();
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("storeOpen", isOpen);
        resp.put("hasActiveShift", isOpen);
        resp.put("activeShift", shiftService.getActiveShift().orElse(null));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/api/shifts/{id}")
    public ResponseEntity<?> getShiftById(@PathVariable String id) {
        return shiftService.getShiftById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/shifts/open")
    public ResponseEntity<?> openShift(@RequestBody Map<String, Object> body) {
        String staffId = (String) body.getOrDefault("staffId", "usr-staff");
        String staffName = (String) body.getOrDefault("staffName", "Cashier");
        String staffRole = (String) body.getOrDefault("staffRole", "CASHIER");
        String registerName = (String) body.getOrDefault("registerName", "Register #1 - Main Bar");
        double startingFloat = 100.00;
        if (body.get("startingFloat") instanceof Number) {
            startingFloat = ((Number) body.get("startingFloat")).doubleValue();
        }
        String notes = (String) body.getOrDefault("notes", "Morning register opening count verified.");

        Shift shift = shiftService.openShift(staffId, staffName, staffRole, registerName, startingFloat, notes);
        return ResponseEntity.ok(shift);
    }

    @PostMapping("/api/shifts/close")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> closeShift(@RequestBody Map<String, Object> body) {
        String shiftId = (String) body.get("shiftId");
        if (shiftId == null || shiftId.isBlank()) {
            // Default to currently active shift if not explicitly provided
            shiftId = shiftService.getActiveShift().map(Shift::getId).orElse(null);
        }
        if (shiftId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No active shift found to close"));
        }

        double physicalCashCount = 0.0;
        if (body.get("physicalCashCount") instanceof Number) {
            physicalCashCount = ((Number) body.get("physicalCashCount")).doubleValue();
        } else if (body.get("actualCashCount") instanceof Number) {
            physicalCashCount = ((Number) body.get("actualCashCount")).doubleValue();
        }
        String closedBy = (String) body.getOrDefault("closedBy", "Cashier");
        String notes = (String) body.getOrDefault("notes", body.getOrDefault("closingNotes", "Shift reconciled and closed."));
        Map<String, Object> denoms = null;
        if (body.get("denominations") instanceof Map) {
            denoms = (Map<String, Object>) body.get("denominations");
        }

        Shift shift = shiftService.closeShift(shiftId, physicalCashCount, closedBy, notes, denoms);
        return ResponseEntity.ok(shift);
    }

    @PostMapping("/api/shifts/cash-movement")
    public ResponseEntity<?> recordCashMovement(@RequestBody Map<String, Object> body) {
        String shiftId = (String) body.get("shiftId");
        if (shiftId == null || shiftId.isBlank()) {
            shiftId = shiftService.getActiveShift().map(Shift::getId).orElse(null);
        }
        if (shiftId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No active shift found"));
        }
        String type = (String) body.getOrDefault("type", "CASH_OUT");
        double amount = 0.0;
        if (body.get("amount") instanceof Number) {
            amount = ((Number) body.get("amount")).doubleValue();
        }
        String reason = (String) body.getOrDefault("reason", "Drawer cash drop / pay-out");
        String performedBy = (String) body.getOrDefault("performedBy", "Cashier");

        try {
            Shift updated = shiftService.recordCashMovement(shiftId, type, amount, reason, performedBy);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- Legacy /api/shift endpoints for backwards compatibility ---

    @PostMapping("/api/shift/z-report")
    public ResponseEntity<?> generateZReport(@RequestBody Map<String, Double> payload) {
        double physicalCount = payload.getOrDefault("physicalCashCount", 0.0);
        Map<String, Object> zReport = orderService.generateZReport(physicalCount);
        return ResponseEntity.ok(zReport);
    }

    @PostMapping("/api/shift/handover")
    public ResponseEntity<?> handover(@RequestBody Map<String, String> payload) {
        String cashierName = payload.getOrDefault("cashierName", "Staff");
        orderService.setCurrentShiftCashier(cashierName);
        return ResponseEntity.ok(Map.of("message", "Shift operator updated to " + cashierName, "cashier", cashierName));
    }

    @GetMapping("/api/shift/status")
    public ResponseEntity<?> getStatus() {
        return ResponseEntity.ok(Map.of(
            "cashier", orderService.getCurrentShiftCashier(),
            "startingFloat", orderService.getStartingFloat(),
            "totalOrders", orderService.getAllOrders().size()
        ));
    }
}
