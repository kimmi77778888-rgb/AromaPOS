package com.example.demo.service;

import com.example.demo.model.DashboardStats;
import com.example.demo.model.Ingredient;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Product;
import org.springframework.stereotype.Service;

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
        List<Order> orders = orderService.getAllOrders();
        List<Product> products = productService.getAllProducts();
        List<Ingredient> ingredients = ingredientService.getAllIngredients();

        double totalRevenue = orders.stream().mapToDouble(Order::getTotal).sum();
        totalRevenue = Math.round(totalRevenue * 100.0) / 100.0;

        int totalOrders = orders.size();
        double avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100.0) / 100.0 : 0.0;

        List<Product> lowStock = products.stream()
                .filter(Product::isLowStock)
                .toList();

        // Hourly Sales (operating hours 8 AM - 6 PM)
        String[] hours = {"8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"};
        double[] baselineHourly = {45.50, 92.00, 145.20, 112.50, 185.00, 130.40, 98.75, 120.00, 85.50, 42.00};
        
        List<Map<String, Object>> hourlySales = new ArrayList<>();
        double runningOrdersRevenue = orders.stream().mapToDouble(Order::getTotal).sum();
        for (int i = 0; i < hours.length; i++) {
            Map<String, Object> h = new HashMap<>();
            h.put("hour", hours[i]);
            double amount = baselineHourly[i] + (i == 4 ? runningOrdersRevenue * 0.2 : 0);
            h.put("sales", Math.round(amount * 100.0) / 100.0);
            h.put("orders", (int)(amount / 12) + 2);
            hourlySales.add(h);
        }

        // Top Selling items aggregated from orders
        Map<String, Integer> itemCounts = new HashMap<>();
        Map<String, Double> itemRevenues = new HashMap<>();
        for (Order o : orders) {
            for (OrderItem item : o.getItems()) {
                itemCounts.put(item.getProductName(), itemCounts.getOrDefault(item.getProductName(), 0) + item.getQuantity());
                itemRevenues.put(item.getProductName(), itemRevenues.getOrDefault(item.getProductName(), 0.0) + item.getSubtotal());
            }
        }

        List<Map<String, Object>> topSelling = new ArrayList<>();
        itemCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .forEach(e -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("name", e.getKey());
                    itemMap.put("unitsSold", e.getValue());
                    itemMap.put("revenue", Math.round(itemRevenues.getOrDefault(e.getKey(), 0.0) * 100.0) / 100.0);
                    topSelling.add(itemMap);
                });

        // Category distribution
        Map<String, Double> categorySales = new HashMap<>();
        categorySales.put("Hot Coffee", 345.50);
        categorySales.put("Iced Coffee", 420.25);
        categorySales.put("Pastries", 215.75);
        categorySales.put("Beans", 155.00);
        categorySales.put("Specialty", 98.50);

        for (Order o : orders) {
            for (OrderItem it : o.getItems()) {
                productService.getAllProducts().stream()
                        .filter(p -> p.getId().equals(it.getProductId()))
                        .findFirst()
                        .ifPresent(p -> categorySales.put(p.getCategory(), 
                            categorySales.getOrDefault(p.getCategory(), 0.0) + it.getSubtotal()));
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

        List<Map<String, Object>> recentOrdersList = new ArrayList<>();
        orders.stream().limit(6).forEach(o -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId());
            map.put("orderNumber", o.getOrderNumber());
            map.put("total", o.getTotal());
            map.put("orderType", o.getOrderType());
            map.put("paymentMethod", o.getPaymentMethod());
            map.put("customerName", o.getCustomerName());
            map.put("itemCount", o.getItems().stream().mapToInt(OrderItem::getQuantity).sum());
            map.put("time", o.getCreatedAt().toString());
            recentOrdersList.add(map);
        });
        stats.setRecentOrders(recentOrdersList);

        return stats;
    }
}
