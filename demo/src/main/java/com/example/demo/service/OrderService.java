package com.example.demo.service;

import com.example.demo.model.CheckoutRequest;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Product;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OrderService {
    private final ProductService productService;
    private final IngredientService ingredientService;
    private final TelegramService telegramService;
    private final List<Order> orders = new CopyOnWriteArrayList<>();
    private final AtomicInteger orderSeq = new AtomicInteger(1040);

    // Register Shift Management
    private boolean storeOpen = false;
    private double startingFloat = 200.00;
    private LocalDateTime shiftStartedAt = LocalDateTime.now().minusHours(8);
    private String currentShiftCashier = "Liam Vance";

    public OrderService(ProductService productService, IngredientService ingredientService, TelegramService telegramService) {
        this.productService = productService;
        this.ingredientService = ingredientService;
        this.telegramService = telegramService;
        seedInitialOrders();
    }

    private void seedInitialOrders() {
        LocalDateTime now = LocalDateTime.now();
        Order o1 = new Order("ord-1", "#ORD-1036", List.of(
            new OrderItem("prod-1", "Artisan Pour Over", 4.75, 2, 9.50, "Oat milk on side"),
            new OrderItem("prod-9", "Flaky Almond Croissant", 4.50, 1, 4.50, "")
        ), 14.00, 1.12, 0.0, 15.12, "CARD", 15.12, 0.0, "DINE_IN", "Liam Vance", "Emma Watson");
        o1.setCreatedAt(now.minusHours(4));
        orders.add(o1);

        Order o2 = new Order("ord-2", "#ORD-1037", List.of(
            new OrderItem("prod-5", "Nitro Cold Brew Reserve", 5.50, 2, 11.00, "Extra ice")
        ), 11.00, 0.88, 1.0, 10.88, "QR_CODE", 20.00, 9.12, "TAKEAWAY", "Liam Vance", "Alex Rivera");
        o2.setCreatedAt(now.minusHours(3));
        orders.add(o2);

        Order o3 = new Order("ord-3", "#ORD-1038", List.of(
            new OrderItem("prod-2", "Velvety Flat White", 4.50, 2, 9.00, "Extra hot")
        ), 9.00, 0.72, 0.0, 9.72, "CASH", 20.00, 10.28, "DINE_IN", "Sophia Bennett", "David Miller");
        o3.setCreatedAt(now.minusHours(2));
        orders.add(o3);

        Order o4 = new Order("ord-4", "#ORD-1039", List.of(
            new OrderItem("prod-6", "Iced Brown Sugar Oat Shaken", 5.75, 3, 17.25, "Light ice")
        ), 17.25, 1.38, 0.0, 18.63, "CARD", 18.63, 0.0, "TAKEAWAY", "Marcus Thorne", "Alex Rivera");
        o4.setCreatedAt(now.minusMinutes(45));
        orders.add(o4);

        Order o5 = new Order("ord-5", "#ORD-1040", List.of(
            new OrderItem("prod-3", "Spanish Caramel Latte", 5.25, 1, 5.25, "Extra drizzle"),
            new OrderItem("prod-9", "Flaky Almond Croissant", 4.50, 1, 4.50, "")
        ), 9.75, 0.78, 0.0, 10.53, "QR_CODE", 10.53, 0.0, "DINE_IN", "Chloe Chen", "Michael Scott");
        o5.setCreatedAt(now.minusMinutes(20));
        orders.add(o5);
    }

    public synchronized Order processCheckout(CheckoutRequest request, String cashierName) {
        if (!storeOpen) {
            throw new IllegalStateException("Store is currently closed. Please open the store / register shift before making sales.");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty");
        }

        // Validate stock and ingredients
        for (OrderItem item : request.getItems()) {
            Optional<Product> pOpt = productService.getProductById(item.getProductId());
            if (pOpt.isEmpty()) {
                throw new IllegalArgumentException("Product not found: " + item.getProductName());
            }
            Product prod = pOpt.get();
            if (prod.getStock() < item.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for: " + item.getProductName());
            }
            if (!ingredientService.hasSufficientStock(prod.getRecipe(), item.getQuantity())) {
                String missing = ingredientService.getDepletedIngredientName(prod.getRecipe());
                throw new IllegalStateException("Cannot prepare " + item.getProductName() + " - Out of " + missing);
            }
        }

        // Deduct product stock AND raw recipe ingredients
        for (OrderItem item : request.getItems()) {
            productService.deductStock(item.getProductId(), item.getQuantity());
            productService.getProductById(item.getProductId())
                .ifPresent(p -> ingredientService.deductForRecipe(p.getRecipe(), item.getQuantity()));
        }

        // Calculate totals
        double subtotal = 0.0;
        for (OrderItem item : request.getItems()) {
            double lineTotal = Math.round(item.getUnitPrice() * item.getQuantity() * 100.0) / 100.0;
            item.setSubtotal(lineTotal);
            subtotal += lineTotal;
        }

        double discount = request.getDiscount() > 0 ? request.getDiscount() : 0.0;
        double tax = Math.round((subtotal - discount) * 0.08 * 100.0) / 100.0;
        if (tax < 0) tax = 0;
        double total = Math.max(0.0, Math.round((subtotal - discount + tax) * 100.0) / 100.0);

        double amountPaid = request.getAmountPaid() >= total ? request.getAmountPaid() : total;
        double change = Math.round((amountPaid - total) * 100.0) / 100.0;

        String id = "ord-" + System.currentTimeMillis();
        String orderNumber = "#ORD-" + orderSeq.incrementAndGet();

        Order order = new Order(
            id,
            orderNumber,
            request.getItems(),
            subtotal,
            tax,
            discount,
            total,
            request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH",
            amountPaid,
            change,
            request.getOrderType() != null ? request.getOrderType() : "DINE_IN",
            cashierName != null ? cashierName : currentShiftCashier,
            request.getCustomerName() != null && !request.getCustomerName().isBlank() ? request.getCustomerName() : "Walk-in Guest"
        );

        if (request.getCustomerPhone() != null) {
            order.setCustomerPhone(request.getCustomerPhone());
        }
        order.setLoyaltyPointsUsed(request.getLoyaltyPointsUsed());
        order.setLoyaltyPointsEarned(request.getLoyaltyPointsEarned());

        orders.add(0, order);

        // Send instant real-time Telegram sales notification
        telegramService.sendOrderPaidNotification(order);

        return order;
    }

    public List<Order> getAllOrders() {
        return orders;
    }

    public List<Order> getOrdersByCashier(String cashierName) {
        if (cashierName == null || cashierName.isBlank() || "ALL".equalsIgnoreCase(cashierName)) {
            return orders;
        }
        String target = cashierName.trim().toLowerCase();
        return orders.stream()
                .filter(o -> o.getCashierName() != null && o.getCashierName().trim().toLowerCase().equals(target))
                .toList();
    }

    public Optional<Order> getOrderById(String id) {
        return orders.stream().filter(o -> o.getId().equals(id) || o.getOrderNumber().equalsIgnoreCase(id)).findFirst();
    }

    public synchronized Order refundOrder(String id, String reason) {
        Optional<Order> oOpt = getOrderById(id);
        if (oOpt.isEmpty()) {
            throw new IllegalArgumentException("Order not found: " + id);
        }
        Order order = oOpt.get();
        if ("REFUNDED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException("Order is already refunded");
        }
        order.setStatus("REFUNDED");
        
        // Restock products and raw ingredients
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                productService.updateStock(item.getProductId(), item.getQuantity());
            }
        }

        // Send instant Telegram refund notification
        telegramService.sendOrderRefundNotification(order, reason);

        return order;
    }

    // Z-Report / Shift Calculations
    public Map<String, Object> generateZReport(double physicalCashCount) {
        double cashSales = orders.stream()
                .filter(o -> "CASH".equalsIgnoreCase(o.getPaymentMethod()))
                .mapToDouble(Order::getTotal)
                .sum();
        double cardSales = orders.stream()
                .filter(o -> "CARD".equalsIgnoreCase(o.getPaymentMethod()))
                .mapToDouble(Order::getTotal)
                .sum();
        double qrSales = orders.stream()
                .filter(o -> "QR_CODE".equalsIgnoreCase(o.getPaymentMethod()) || "KHQR".equalsIgnoreCase(o.getPaymentMethod()))
                .mapToDouble(Order::getTotal)
                .sum();
        double totalGrossSales = orders.stream().mapToDouble(Order::getTotal).sum();
        double refunds = 0.0;

        double expectedCash = Math.round((startingFloat + cashSales - refunds) * 100.0) / 100.0;
        double variance = Math.round((physicalCashCount - expectedCash) * 100.0) / 100.0;

        Map<String, Object> report = new HashMap<>();
        report.put("reportNumber", "Z-REP-" + System.currentTimeMillis());
        report.put("shiftStartedAt", shiftStartedAt.toString());
        report.put("shiftClosedAt", LocalDateTime.now().toString());
        report.put("operator", currentShiftCashier);
        report.put("startingFloat", startingFloat);
        report.put("cashSales", Math.round(cashSales * 100.0) / 100.0);
        report.put("cardSales", Math.round(cardSales * 100.0) / 100.0);
        report.put("qrSales", Math.round(qrSales * 100.0) / 100.0);
        report.put("totalGrossSales", Math.round(totalGrossSales * 100.0) / 100.0);
        report.put("refunds", refunds);
        report.put("expectedCash", expectedCash);
        report.put("physicalCashCount", Math.round(physicalCashCount * 100.0) / 100.0);
        report.put("variance", variance);
        report.put("status", variance == 0 ? "BALANCED" : (variance > 0 ? "OVERAGE" : "SHORTAGE"));
        report.put("totalTickets", orders.size());

        // Send instant Telegram Z-Report shift closure summary
        telegramService.sendZReportNotification(currentShiftCashier, totalGrossSales, cashSales, qrSales, orders.size(), variance);

        return report;
    }

    public void setCurrentShiftCashier(String cashierName) {
        this.currentShiftCashier = cashierName;
    }

    public String getCurrentShiftCashier() {
        return this.currentShiftCashier;
    }

    public void setStartingFloat(double startingFloat) {
        this.startingFloat = startingFloat;
    }

    public double getStartingFloat() {
        return this.startingFloat;
    }

    public boolean isStoreOpen() {
        return this.storeOpen;
    }

    public void setStoreOpen(boolean storeOpen) {
        this.storeOpen = storeOpen;
    }
}
