package com.example.demo.controller;

import com.example.demo.model.CheckoutRequest;
import com.example.demo.model.Order;
import com.example.demo.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders(@RequestParam(value = "cashier", required = false) String cashier,
                                                    @RequestHeader(value = "X-Cashier-Name", required = false) String cashierHeader) {
        String filterTarget = (cashier != null && !cashier.isBlank()) ? cashier : cashierHeader;
        if (filterTarget != null && !filterTarget.isBlank() && !filterTarget.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(orderService.getOrdersByCashier(filterTarget));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable String id) {
        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest request,
                                      @RequestHeader(value = "X-Cashier-Name", required = false, defaultValue = "Liam Vance") String cashierName) {
        try {
            String resolvedCashier = (request.getCashierName() != null && !request.getCashierName().isBlank())
                    ? request.getCashierName()
                    : cashierName;
            Order order = orderService.processCheckout(request, resolvedCashier);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Order processing error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<?> refundOrder(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.getOrDefault("reason", "Customer requested refund") : "Customer requested refund";
            Order order = orderService.refundOrder(id, reason);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Refund processing error: " + e.getMessage()));
        }
    }
}
