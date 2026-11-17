package com.example.demo.service;

import com.example.demo.model.DashboardStats;
import com.example.demo.model.Ingredient;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Product;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DashboardService {
    private final OrderService orderService;
    private final ProductService productService;
    private final IngredientService ingredientService;

    public DashboardService(OrderService orderService, ProductService productService, IngredientService ingredientService) {
        this.orderService = orderService;
        this.productService = productService;
        this.ingredientService = ingredientService;
    }

    public DashboardStats getStats() {
        return getStatsForRange("all");
    }

    public DashboardStats getStatsForRange(String range) {
        List<Order> allOrders = orderService.getAllOrders();
        List<Product> products = productService.getAllProducts();
        List<Ingredient> ingredients = ingredientService.getAllIngredients();

        LocalDateTime now = LocalDateTime.now();

        // 1. Filter out refunded orders and filter by requested date range
        List<Order> validOrders = allOrders.stream()
                .filter(o -> !"REFUNDED".equalsIgnoreCase(o.getStatus()))
                .filter(o -> {
                    if (range == null || range.isBlank() || "all".equalsIgnoreCase(range)) return true;
                    if (o.getCreatedAt() == null) return true;
                    if ("today".equalsIgnoreCase(range)) {
                        return o.getCreatedAt().toLocalDate().isEqual(now.toLocalDate());
                    } else if ("yesterday".equalsIgnoreCase(range)) {
                        return o.getCreatedAt().toLocalDate().isEqual(now.toLocalDate().minusDays(1));
                    } else if ("week".equalsIgnoreCase(range)) {
                        return o.getCreatedAt().isAfter(now.minusDays(7));
                    } else if ("month".equalsIgnoreCase(range)) {
                        return o.getCreatedAt().isAfter(now.minusDays(30));
                    }
                    return true;
                })
                .toList();

        double totalRevenue = validOrders.stream().mapToDouble(Order::getTotal).sum();
        totalRevenue = Math.round(totalRevenue * 100.0) / 100.0;

        int totalOrders = validOrders.size();
        double avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100.0) / 100.0 : 0.0;

        List<Product> lowStock = products.stream()
                .filter(Product::isLowStock)
                .toList();

        // 2. Dynamic Hourly Sales grouped directly from actual order timestamps (7 AM - 9 PM)
        int[] hoursOfDay = {7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21};
        String[] hourLabels = {"7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"};
        
        List<Map<String, Object>> hourlySales = new ArrayList<>();
        for (int i = 0; i < hoursOfDay.length; i++) {
            final int h = hoursOfDay[i];
            double hourSales = validOrders.stream()
                    .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getHour() == h)
                    .mapToDouble(Order::getTotal)
                    .sum();
            int hourTickets = (int) validOrders.stream()
                    .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getHour() == h)
                    .count();

            Map<String, Object> hMap = new HashMap<>();
            hMap.put("hour", hourLabels[i]);
            hMap.put("sales", Math.round(hourSales * 100.0) / 100.0);
            hMap.put("orders", hourTickets);
            hourlySales.add(hMap);
        }

        // 3. Dynamic Top Selling items aggregated directly from valid orders
        Map<String, Integer> itemCounts = new HashMap<>();
        Map<String, Double> itemRevenues = new HashMap<>();
        for (Order o : validOrders) {
            for (OrderItem item : o.getItems()) {
                String pName = item.getProductName() != null ? item.getProductName() : "Product";
                itemCounts.put(pName, itemCounts.getOrDefault(pName, 0) + item.getQuantity());
                itemRevenues.put(pName, itemRevenues.getOrDefault(pName, 0.0) + item.getSubtotal());
            }
        }

        List<Map<String, Object>> topSelling = new ArrayList<>();
        itemCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(6)
                .forEach(e -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("name", e.getKey());
                    itemMap.put("unitsSold", e.getValue());
                    itemMap.put("revenue", Math.round(itemRevenues.getOrDefault(e.getKey(), 0.0) * 100.0) / 100.0);
                    topSelling.add(itemMap);
                });

        // 4. Dynamic Category distribution: dynamically populated from product catalog and order items
        Map<String, Double> categorySales = new LinkedHashMap<>();
        products.stream()
                .map(Product::getCategory)
                .filter(Objects::nonNull)
                .distinct()
                .forEach(c -> categorySales.put(c, 0.0));

        for (Order o : validOrders) {
            for (OrderItem it : o.getItems()) {
                Product p = products.stream()
                        .filter(prod -> prod.getId() != null && prod.getId().equals(it.getProductId()))
                        .findFirst()
                        .orElse(null);
                String cat = (p != null && p.getCategory() != null) ? p.getCategory() : "Specialty";
                categorySales.put(cat, categorySales.getOrDefault(cat, 0.0) + it.getSubtotal());
            }
        }

        for (Map.Entry<String, Double> entry : categorySales.entrySet()) {
            categorySales.put(entry.getKey(), Math.round(entry.getValue() * 100.0) / 100.0);
        }

        DashboardStats stats = new DashboardStats();
        stats.setTotalRevenue(totalRevenue);
        stats.setTotalOrders(totalOrders);
        stats.setLowStockCount(lowStock.size() + ingredientService.getLowStockIngredients().size());
        stats.setAverageOrderValue(avgOrderValue);
        stats.setLowStockProducts(lowStock);
        stats.setHourlySales(hourlySales);
        stats.setTopSellingItems(topSelling);
        stats.setSalesByCategory(categorySales);

        // 5. Dynamic Recent Orders Feed
        List<Map<String, Object>> recentOrdersList = new ArrayList<>();
        allOrders.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(8)
                .forEach(o -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", o.getId());
                    map.put("orderNumber", o.getOrderNumber());
                    map.put("total", o.getTotal());
                    map.put("orderType", o.getOrderType());
                    map.put("channel", o.getChannel() != null ? o.getChannel() : "IN_STORE");
                    map.put("paymentMethod", o.getPaymentMethod());
                    map.put("status", o.getStatus());
                    map.put("customerName", o.getCustomerName());
                    map.put("cashierName", o.getCashierName());
                    map.put("itemCount", o.getItems().stream().mapToInt(OrderItem::getQuantity).sum());
                    map.put("time", o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
                    recentOrdersList.add(map);
                });
        stats.setRecentOrders(recentOrdersList);

        return stats;
    }
}
