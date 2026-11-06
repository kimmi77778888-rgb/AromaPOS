package com.example.demo.service;

import com.example.demo.config.BakongConfig;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class TelegramService {

    private final BakongConfig bakongConfig;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TelegramService(BakongConfig bakongConfig) {
        this.bakongConfig = bakongConfig;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder().build();
    }

    public CompletableFuture<Boolean> sendMessage(String textHtml) {
        if (!bakongConfig.isTelegramEnabled() || 
            bakongConfig.getTelegramBotToken() == null || 
            bakongConfig.getTelegramChatId() == null) {
            return CompletableFuture.completedFuture(false);
        }

        try {
            String url = "https://api.telegram.org/bot" + bakongConfig.getTelegramBotToken() + "/sendMessage";

            Map<String, String> payload = new HashMap<>();
            payload.put("chat_id", bakongConfig.getTelegramChatId());
            payload.put("text", textHtml);
            payload.put("parse_mode", "HTML");

            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenApply(response -> {
                        System.out.println("[Telegram] Status " + response.statusCode() + ": " + response.body());
                        return response.statusCode() == 200;
                    })
                    .exceptionally(ex -> {
                        System.err.println("[Telegram Error]: " + ex.getMessage());
                        return false;
                    });
        } catch (Exception e) {
            System.err.println("Failed to serialize Telegram message: " + e.getMessage());
            return CompletableFuture.completedFuture(false);
        }
    }

    public void sendOrderPaidNotification(Order order) {
        StringBuilder sb = new StringBuilder();
        sb.append("☕ <b>NEW ORDER PAID — ").append(order.getOrderNumber()).append("</b>\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("👤 <b>Cashier:</b> ").append(order.getCashierName() != null ? order.getCashierName() : "Cashier").append("\n");
        sb.append("📋 <b>Customer:</b> ").append(order.getCustomerName() != null ? order.getCustomerName() : "Walk-in Guest");
        sb.append(" (").append("TAKEAWAY".equals(order.getOrderType()) ? "🥡 Takeaway" : "🍽️ Dine In").append(")\n");

        double total = order.getTotal();
        long khrTotal = Math.round(total * 4100);
        sb.append("💰 <b>Total:</b> $").append(String.format("%.2f", total))
          .append(" (").append(String.format("%,d ៛", khrTotal)).append(")\n");

        String method = order.getPaymentMethod();
        if ("KHQR".equalsIgnoreCase(method) || "QR_CODE".equalsIgnoreCase(method)) {
            sb.append("💳 <b>Payment:</b> Bakong KHQR (<code>").append(bakongConfig.getMerchantId()).append("</code>)\n");
        } else if ("CASH".equalsIgnoreCase(method)) {
            sb.append("💵 <b>Payment:</b> Cash (Received: $").append(String.format("%.2f", order.getAmountPaid()))
              .append(" | Change: $").append(String.format("%.2f", order.getChange())).append(")\n");
        } else {
            sb.append("💳 <b>Payment:</b> Card / Electronic\n");
        }

        sb.append("\n📦 <b>Order Items:</b>\n");
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                sb.append(" • ").append(item.getQuantity()).append("x ")
                  .append("<b>").append(item.getProductName()).append("</b>")
                  .append(" ($").append(String.format("%.2f", item.getSubtotal())).append(")\n");
            }
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String timeStr = order.getCreatedAt() != null ? order.getCreatedAt().format(dtf) : "Now";
        sb.append("\n🕒 <i>").append(timeStr).append("</i> • <b>").append(bakongConfig.getMerchantName()).append("</b>");

        sendMessage(sb.toString());
    }

    public void sendZReportNotification(String cashierName, double totalRevenue, double cashTotal, double khqrTotal, int orderCount, double overShort) {
        long khrTotal = Math.round(totalRevenue * 4100);
        StringBuilder sb = new StringBuilder();
        sb.append("📊 <b>REGISTER SHIFT CLOSED (Z-REPORT)</b>\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("👤 <b>Cashier:</b> ").append(cashierName).append("\n");
        sb.append("🧾 <b>Total Orders:</b> ").append(orderCount).append(" tickets\n");
        sb.append("💰 <b>Gross Revenue:</b> $").append(String.format("%.2f", totalRevenue))
          .append(" (").append(String.format("%,d ៛", khrTotal)).append(")\n");
        sb.append("💵 <b>Cash Collected:</b> $").append(String.format("%.2f", cashTotal)).append("\n");
        sb.append("📱 <b>Bakong KHQR:</b> $").append(String.format("%.2f", khqrTotal)).append("\n");

        if (overShort == 0) {
            sb.append("⚖️ <b>Drawer Balance:</b> ✅ EXACT ($0.00)\n");
        } else if (overShort > 0) {
            sb.append("⚖️ <b>Drawer Balance:</b> 🟢 SURPLUS (+$").append(String.format("%.2f", overShort)).append(")\n");
        } else {
            sb.append("⚖️ <b>Drawer Balance:</b> 🔴 SHORTAGE (-$").append(String.format("%.2f", Math.abs(overShort))).append(")\n");
        }

        sb.append("\n🏛️ <b>Merchant:</b> ").append(bakongConfig.getMerchantName())
          .append(" (").append(bakongConfig.getMerchantCity()).append(")");

        sendMessage(sb.toString());
    }

    public void sendLowStockAlert(String itemName, String currentStock, String threshold) {
        StringBuilder sb = new StringBuilder();
        sb.append("⚠️ <b>CRITICAL LOW STOCK ALERT</b>\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("📦 <b>Material:</b> ").append(itemName).append("\n");
        sb.append("📉 <b>Current Stock:</b> <code>").append(currentStock).append("</code>\n");
        sb.append("🚨 <b>Threshold:</b> ").append(threshold).append("\n");
        sb.append("🔔 <i>Please restock immediately to avoid menu item auto-disabling.</i>");

        sendMessage(sb.toString());
    }

    public void sendOrderRefundNotification(Order order, String reason) {
        StringBuilder sb = new StringBuilder();
        sb.append("⚠️ <b>ORDER REFUNDED / VOIDED — ").append(order.getOrderNumber()).append("</b>\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("👤 <b>Cashier:</b> ").append(order.getCashierName() != null ? order.getCashierName() : "Cashier").append("\n");
        sb.append("📋 <b>Customer:</b> ").append(order.getCustomerName() != null ? order.getCustomerName() : "Walk-in Guest").append("\n");
        double total = order.getTotal();
        long khrTotal = Math.round(total * 4100);
        sb.append("💸 <b>Refund Amount:</b> $").append(String.format("%.2f", total))
          .append(" (").append(String.format("%,d ៛", khrTotal)).append(")\n");
        sb.append("📝 <b>Reason:</b> ").append(reason != null ? reason : "Customer request").append("\n");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        sb.append("\n🕒 <i>").append(java.time.LocalDateTime.now().format(dtf)).append("</i> • <b>").append(bakongConfig.getMerchantName()).append("</b>");

        sendMessage(sb.toString());
    }
}
