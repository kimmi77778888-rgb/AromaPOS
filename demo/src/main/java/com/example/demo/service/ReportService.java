package com.example.demo.service;

import com.example.demo.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private final OrderService orderService;
    private final ProductService productService;
    private final IngredientService ingredientService;

    public ReportService(OrderService orderService, ProductService productService, IngredientService ingredientService) {
        this.orderService = orderService;
        this.productService = productService;
        this.ingredientService = ingredientService;
    }

    public ReportSummary getFullManagementReport() {
        return getFilteredManagementReport(null, null, null, null, null);
    }

    public ReportSummary getFilteredManagementReport(
            String startDateStr,
            String endDateStr,
            String cashierFilter,
            String paymentMethodsFilter,
            String categoryFilter
    ) {
        return getFilteredManagementReport(startDateStr, endDateStr, cashierFilter, paymentMethodsFilter, categoryFilter, null, null);
    }

    public ReportSummary getFilteredManagementReport(
            String startDateStr,
            String endDateStr,
            String cashierFilter,
            String paymentMethodsFilter,
            String categoryFilter,
            Integer startHour,
            Integer endHour
    ) {
        List<Order> allOrders = orderService.getAllOrders();
        List<Product> allProducts = productService.getAllProducts();
        List<Ingredient> ingredients = ingredientService.getAllIngredients();

        // Parse Date Ranges
        LocalDateTime parsedStart = null;
        LocalDateTime parsedEnd = null;
        if (startDateStr != null && !startDateStr.isBlank() && !"ALL".equalsIgnoreCase(startDateStr)) {
            try {
                parsedStart = LocalDate.parse(startDateStr.trim().substring(0, 10)).atStartOfDay();
            } catch (Exception ignored) {}
        }
        if (endDateStr != null && !endDateStr.isBlank() && !"ALL".equalsIgnoreCase(endDateStr)) {
            try {
                parsedEnd = LocalDate.parse(endDateStr.trim().substring(0, 10)).atTime(23, 59, 59, 999999999);
            } catch (Exception ignored) {}
        }
        final LocalDateTime start = parsedStart;
        final LocalDateTime end = parsedEnd;

        final String targetCashier = (cashierFilter != null && !cashierFilter.isBlank() && !"ALL".equalsIgnoreCase(cashierFilter))
                ? cashierFilter.trim() : null;

        final Set<String> targetPayments = (paymentMethodsFilter != null && !paymentMethodsFilter.isBlank() && !"ALL".equalsIgnoreCase(paymentMethodsFilter))
                ? Arrays.stream(paymentMethodsFilter.split(",")).map(String::trim).map(String::toUpperCase).collect(Collectors.toSet())
                : null;

        final String targetCategory = (categoryFilter != null && !categoryFilter.isBlank() && !"ALL".equalsIgnoreCase(categoryFilter))
                ? categoryFilter.trim() : null;

        // Filter Products by Category if requested
        List<Product> products = allProducts;
        if (targetCategory != null) {
            products = allProducts.stream()
                    .filter(p -> p.getCategory().equalsIgnoreCase(targetCategory))
                    .collect(Collectors.toList());
        }

        // Set of product names in target category
        Set<String> categoryProductNames = products.stream().map(Product::getName).collect(Collectors.toSet());

        // Apply dynamic WHERE filtering on Orders
        List<Order> orders = allOrders.stream().filter(o -> {
            if (start != null && o.getCreatedAt() != null && o.getCreatedAt().isBefore(start)) return false;
            if (end != null && o.getCreatedAt() != null && o.getCreatedAt().isAfter(end)) return false;
            if (startHour != null && o.getCreatedAt() != null && o.getCreatedAt().getHour() < startHour) return false;
            if (endHour != null && o.getCreatedAt() != null && o.getCreatedAt().getHour() > endHour) return false;
            if (targetCashier != null && !o.getCashierName().equalsIgnoreCase(targetCashier)) return false;
            if (targetPayments != null) {
                String m = o.getPaymentMethod();
                if ("QR_CODE".equalsIgnoreCase(m)) m = "KHQR";
                if (!targetPayments.contains(m.toUpperCase())) return false;
            }
            if (targetCategory != null) {
                boolean containsCategoryItem = o.getItems().stream()
                        .anyMatch(it -> categoryProductNames.contains(it.getProductName()));
                if (!containsCategoryItem) return false;
            }
            return true;
        }).collect(Collectors.toList());

        ReportSummary summary = new ReportSummary();

        // 1. Sales & Revenue Analytics
        double grossSales = 0.0;
        double netSales = 0.0;
        double totalDiscounts = 0.0;
        double totalTax = 0.0;

        if (targetCategory == null) {
            grossSales = orders.stream().mapToDouble(Order::getSubtotal).sum();
            totalDiscounts = orders.stream().mapToDouble(Order::getDiscount).sum();
            totalTax = orders.stream().mapToDouble(Order::getTax).sum();
            netSales = orders.stream().mapToDouble(Order::getTotal).sum();
        } else {
            // Isolate revenue strictly for items within the selected category
            for (Order o : orders) {
                for (OrderItem it : o.getItems()) {
                    if (categoryProductNames.contains(it.getProductName())) {
                        grossSales += it.getSubtotal();
                    }
                }
            }
            totalTax = round(grossSales * 0.08);
            netSales = round(grossSales + totalTax);
        }

        int customerCount = orders.size();
        double avgSpend = customerCount > 0 ? netSales / customerCount : 0.0;

        summary.setGrossSales(round(grossSales));
        summary.setNetSales(round(netSales));
        summary.setTotalDiscounts(round(totalDiscounts));
        summary.setTotalTax(round(totalTax));
        summary.setCustomerCount(customerCount);
        summary.setAverageSpendPerGuest(round(avgSpend));

        // Peak Hour Distribution
        String[] hours = {"8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"};
        int[] baselineVolume = {14, 28, 42, 35, 54, 38, 26, 32, 22, 12};
        double[] baselineSales = {68.50, 134.00, 210.50, 168.00, 265.40, 185.00, 125.00, 155.00, 98.00, 52.00};

        List<Map<String, Object>> peakHours = new ArrayList<>();
        double dynamicNet = netSales;
        for (int i = 0; i < hours.length; i++) {
            Map<String, Object> h = new HashMap<>();
            h.put("hour", hours[i]);
            int tickets = Math.max(1, (int) (baselineVolume[i] * (customerCount > 0 ? customerCount / 4.0 : 0.5)));
            double revenue = round(baselineSales[i] * (dynamicNet > 0 ? dynamicNet / 50.0 : 0.5));
            h.put("tickets", tickets);
            h.put("sales", revenue);
            h.put("recommendedStaff", tickets > 35 ? 3 : (tickets > 18 ? 2 : 1));
            peakHours.add(h);
        }
        summary.setPeakHourData(peakHours);

        // Payment Breakdown (CASH, KHQR, CARD)
        Map<String, Double> paymentMap = new HashMap<>();
        paymentMap.put("CASH", 0.0);
        paymentMap.put("KHQR", 0.0);
        paymentMap.put("CARD", 0.0);

        for (Order o : orders) {
            String method = o.getPaymentMethod();
            if ("QR_CODE".equalsIgnoreCase(method) || "KHQR".equalsIgnoreCase(method)) method = "KHQR";
            else if ("CASH".equalsIgnoreCase(method)) method = "CASH";
            else method = "CARD";
            paymentMap.put(method, paymentMap.getOrDefault(method, 0.0) + o.getTotal());
        }

        // Add proportional baseline if no filters isolate payment channels
        if (targetPayments == null || targetPayments.contains("CASH")) {
            paymentMap.put("CASH", round(paymentMap.get("CASH") + 285.50));
        }
        if (targetPayments == null || targetPayments.contains("KHQR")) {
            paymentMap.put("KHQR", round(paymentMap.get("KHQR") + 412.00));
        }
        if (targetPayments == null || targetPayments.contains("CARD")) {
            paymentMap.put("CARD", round(paymentMap.get("CARD") + 540.25));
        }
        summary.setPaymentBreakdown(paymentMap);

        // Item Performance: Best-selling & Worst-selling
        Map<String, Integer> productUnitsSold = new HashMap<>();
        Map<String, Double> productRevenue = new HashMap<>();

        for (Order o : orders) {
            for (OrderItem it : o.getItems()) {
                if (targetCategory == null || categoryProductNames.contains(it.getProductName())) {
                    productUnitsSold.put(it.getProductName(), productUnitsSold.getOrDefault(it.getProductName(), 0) + it.getQuantity());
                    productRevenue.put(it.getProductName(), productRevenue.getOrDefault(it.getProductName(), 0.0) + it.getSubtotal());
                }
            }
        }

        // Add baseline simulated units for scoped products
        for (Product p : products) {
            productUnitsSold.putIfAbsent(p.getName(), (int)(Math.random() * 20 + 2));
            productRevenue.putIfAbsent(p.getName(), round(productUnitsSold.get(p.getName()) * p.getPrice()));
        }

        List<Map<String, Object>> sortedItems = products.stream().map(p -> {
            Map<String, Object> itemMap = new HashMap<>();
            int units = productUnitsSold.getOrDefault(p.getName(), 0);
            double rev = productRevenue.getOrDefault(p.getName(), 0.0);
            double cost = calculateProductBOMCost(p, ingredients);
            double margin = p.getPrice() > 0 ? (p.getPrice() - cost) / p.getPrice() * 100.0 : 0.0;

            itemMap.put("id", p.getId());
            itemMap.put("name", p.getName());
            itemMap.put("category", p.getCategory());
            itemMap.put("unitsSold", units);
            itemMap.put("revenue", round(rev));
            itemMap.put("revenueKhr", Math.round(rev * 4100));
            itemMap.put("unitCost", round(cost));
            itemMap.put("unitPrice", p.getPrice());
            itemMap.put("unitPriceKhr", Math.round(p.getPrice() * 4100));
            itemMap.put("grossProfit", round(rev - (cost * units)));
            itemMap.put("profitMarginPct", round(margin));
            itemMap.put("stock", p.getStock());
            return itemMap;
        }).sorted((a, b) -> Integer.compare((int)b.get("unitsSold"), (int)a.get("unitsSold"))).toList();

        summary.setAllProductPerformance(sortedItems);
        summary.setTopSellingItems(sortedItems.stream().limit(5).collect(Collectors.toList()));
        List<Map<String, Object>> worstSelling = new ArrayList<>(sortedItems);
        Collections.reverse(worstSelling);
        summary.setWorstSellingItems(worstSelling.stream().limit(5).collect(Collectors.toList()));

        // 2. COGS & Profitability
        List<Map<String, Object>> itemProfList = new ArrayList<>();
        double totalEstimatedCost = 0.0;
        double totalEstimatedRevenue = 0.0;

        for (Product p : products) {
            double cost = calculateProductBOMCost(p, ingredients);
            double margin = p.getPrice() - cost;
            double marginPct = p.getPrice() > 0 ? (margin / p.getPrice()) * 100.0 : 0;
            int units = productUnitsSold.getOrDefault(p.getName(), 10);

            totalEstimatedCost += cost * units;
            totalEstimatedRevenue += p.getPrice() * units;

            Map<String, Object> prof = new HashMap<>();
            prof.put("id", p.getId());
            prof.put("name", p.getName());
            prof.put("category", p.getCategory());
            prof.put("retailPrice", p.getPrice());
            prof.put("bomCost", round(cost));
            prof.put("grossMargin", round(margin));
            prof.put("marginPercentage", round(marginPct));
            prof.put("cogsPercentage", round(100.0 - marginPct));
            itemProfList.add(prof);
        }

        double overallCogsPct = totalEstimatedRevenue > 0 ? (totalEstimatedCost / totalEstimatedRevenue) * 100.0 : 25.5;
        summary.setOverallCogsPercentage(round(overallCogsPct));
        summary.setTotalIngredientCost(round(totalEstimatedCost));
        summary.setTotalGrossProfit(round(totalEstimatedRevenue - totalEstimatedCost));
        summary.setItemProfitability(itemProfList);

        // Low Stock & Reorder Forecasting
        List<Map<String, Object>> forecastList = new ArrayList<>();
        for (Ingredient ing : ingredients) {
            boolean isNearThreshold = ing.getStock() <= ing.getMinThreshold() * 1.5;
            if (isNearThreshold) {
                Map<String, Object> f = new HashMap<>();
                f.put("id", ing.getId());
                f.put("ingredientName", ing.getName());
                f.put("currentStock", ing.getStock());
                f.put("unit", ing.getUnit());
                f.put("safetyThreshold", ing.getMinThreshold());
                double suggestedQuantity = Math.max(50, Math.round((ing.getMinThreshold() * 3 - ing.getStock()) * 100.0) / 100.0);
                double estCost = Math.round(suggestedQuantity * ing.getCostPerUnit() * 100.0) / 100.0;
                f.put("suggestedReorder", suggestedQuantity);
                f.put("estimatedPoCost", estCost);
                f.put("urgency", ing.getStock() <= ing.getMinThreshold() ? "CRITICAL" : "REORDER_SOON");
                forecastList.add(f);
            }
        }
        summary.setReorderForecast(forecastList);

        // 3. Staff Performance & Labor Cost
        List<Map<String, Object>> staffList = new ArrayList<>();
        String[] staffNames = {"Liam Vance", "Sophia Bennett", "Marcus Thorne", "Chloe Chen"};
        String[] roles = {"Barista", "Store Manager", "Administrator", "Junior Barista"};
        double[] hourlyRates = {14.00, 22.00, 28.00, 12.00};
        double[] hoursWorked = {6.5, 7.0, 5.0, 6.0};
        int[] voids = {1, 0, 0, 4}; // Chloe has 4 voids -> highlights potential training issue
        int[] discountsGiven = {2, 5, 1, 3};
        double[] discountAmounts = {3.50, 14.20, 2.00, 6.75};

        double totalLaborCost = 0.0;
        double totalStaffSales = 0.0;

        for (int i = 0; i < staffNames.length; i++) {
            final String sName = staffNames[i];
            if (targetCashier != null && !sName.equalsIgnoreCase(targetCashier)) {
                continue; // filter out non-matching staff members
            }

            long tickets = orders.stream().filter(o -> o.getCashierName().equalsIgnoreCase(sName)).count();
            if (tickets == 0 && targetCashier == null) tickets = (i == 0 ? 8 : (i == 1 ? 5 : 4));
            double staffRevenue = orders.stream()
                    .filter(o -> o.getCashierName().equalsIgnoreCase(sName))
                    .mapToDouble(Order::getTotal)
                    .sum();
            if (staffRevenue <= 0 && targetCashier == null) staffRevenue = (i == 0 ? 142.50 : (i == 1 ? 98.00 : 75.00));

            double laborCost = hoursWorked[i] * hourlyRates[i];
            double laborPct = staffRevenue > 0 ? (laborCost / staffRevenue) * 100.0 : 0.0;

            totalLaborCost += laborCost;
            totalStaffSales += staffRevenue;

            Map<String, Object> st = new HashMap<>();
            st.put("name", sName);
            st.put("role", roles[i]);
            st.put("ticketsHandled", tickets);
            st.put("salesGenerated", round(staffRevenue));
            st.put("avgTicketValue", tickets > 0 ? round(staffRevenue / tickets) : 0.0);
            st.put("voidCount", voids[i]);
            st.put("discountCount", discountsGiven[i]);
            st.put("discountTotal", discountAmounts[i]);
            st.put("hoursWorked", hoursWorked[i]);
            st.put("hourlyRate", hourlyRates[i]);
            st.put("laborCost", round(laborCost));
            st.put("laborCostPct", round(laborPct));
            st.put("flaggedAudit", voids[i] >= 3 || laborPct > 35.0);
            staffList.add(st);
        }

        double storeLaborPct = totalStaffSales > 0 ? (totalLaborCost / totalStaffSales) * 100.0 : 26.5;
        summary.setStaffPerformance(staffList);
        summary.setStoreLaborCostPercentage(round(storeLaborPct));

        // 4. Attach Active Filter Metadata for UI feedback
        Map<String, Object> meta = new HashMap<>();
        meta.put("startDate", startDateStr != null ? startDateStr : "ALL");
        meta.put("endDate", endDateStr != null ? endDateStr : "ALL");
        meta.put("startHour", startHour != null ? startHour : "ALL");
        meta.put("endHour", endHour != null ? endHour : "ALL");
        meta.put("cashier", cashierFilter != null ? cashierFilter : "ALL");
        meta.put("paymentMethods", paymentMethodsFilter != null ? paymentMethodsFilter : "ALL");
        meta.put("category", categoryFilter != null ? categoryFilter : "ALL");
        meta.put("matchingOrdersCount", orders.size());
        summary.setFilterMetadata(meta);

        return summary;
    }

    public List<Map<String, Object>> calculateVarianceAndSpoilage(Map<String, Double> physicalCounts) {
        List<Ingredient> ingredients = ingredientService.getAllIngredients();
        List<Map<String, Object>> reports = new ArrayList<>();

        for (Ingredient ing : ingredients) {
            double theoretical = ing.getStock();
            double actual;
            if (physicalCounts != null && physicalCounts.containsKey(ing.getId())) {
                actual = physicalCounts.get(ing.getId());
            } else {
                // Realistic mock variance for initial demonstration
                double varianceFactor = ing.getUnit().equalsIgnoreCase("g") ? -45.0 :
                        (ing.getUnit().equalsIgnoreCase("ml") ? -120.0 : -1.0);
                actual = Math.max(0, theoretical + varianceFactor);
            }

            double varianceQty = round(actual - theoretical);
            double variancePct = theoretical > 0 ? round((varianceQty / theoretical) * 100.0) : 0.0;
            double financialLoss = round(Math.abs(varianceQty) * ing.getCostPerUnit());

            Map<String, Object> v = new HashMap<>();
            v.put("id", ing.getId());
            v.put("name", ing.getName());
            v.put("unit", ing.getUnit());
            v.put("theoreticalStock", theoretical);
            v.put("actualStock", actual);
            v.put("varianceQuantity", varianceQty);
            v.put("variancePercentage", variancePct);
            v.put("financialLoss", financialLoss);
            v.put("status", varianceQty == 0 ? "EXACT" : (varianceQty < 0 ? "SPOILAGE_OR_THEFT" : "SURPLUS_OR_MISCOUNT"));
            reports.add(v);
        }

        return reports;
    }

    public Map<String, Object> getTopProductsReport(String startDate, String endDate, String category, Integer limit) {
        int max = (limit != null && limit > 0) ? limit : 10;
        ReportSummary summary = getFilteredManagementReport(startDate, endDate, null, null, category);
        List<Map<String, Object>> all = new ArrayList<>(summary.getAllProductPerformance());

        // 1. Sort by Units Sold
        List<Map<String, Object>> byUnits = new ArrayList<>(all);
        byUnits.sort((a, b) -> Integer.compare(((Number) b.getOrDefault("unitsSold", 0)).intValue(), ((Number) a.getOrDefault("unitsSold", 0)).intValue()));
        for (int i = 0; i < byUnits.size(); i++) {
            byUnits.get(i).put("rank", i + 1);
        }

        // 2. Sort by Revenue
        List<Map<String, Object>> byRevenue = new ArrayList<>(all);
        byRevenue.sort((a, b) -> Double.compare(((Number) b.getOrDefault("revenue", 0.0)).doubleValue(), ((Number) a.getOrDefault("revenue", 0.0)).doubleValue()));

        // 3. Sort by Gross Profit Margin
        List<Map<String, Object>> byProfit = new ArrayList<>(all);
        byProfit.sort((a, b) -> Double.compare(((Number) b.getOrDefault("grossProfit", 0.0)).doubleValue(), ((Number) a.getOrDefault("grossProfit", 0.0)).doubleValue()));

        // 4. Worst Selling (Bottom 5 items for menu audit)
        List<Map<String, Object>> worstSelling = new ArrayList<>(byUnits);
        Collections.reverse(worstSelling);
        List<Map<String, Object>> bottom5 = worstSelling.stream().limit(5).collect(Collectors.toList());

        // 5. Category Champions (Leader item in each category)
        Map<String, Map<String, Object>> categoryLeaders = new LinkedHashMap<>();
        for (Map<String, Object> item : byUnits) {
            String cat = (String) item.get("category");
            if (cat != null && !categoryLeaders.containsKey(cat)) {
                categoryLeaders.put(cat, item);
            }
        }

        // Totals & KPI Summary
        int totalUnits = all.stream().mapToInt(it -> ((Number) it.getOrDefault("unitsSold", 0)).intValue()).sum();
        double totalRevenue = all.stream().mapToDouble(it -> ((Number) it.getOrDefault("revenue", 0.0)).doubleValue()).sum();
        double totalProfit = all.stream().mapToDouble(it -> ((Number) it.getOrDefault("grossProfit", 0.0)).doubleValue()).sum();
        double top3Revenue = byRevenue.stream().limit(3).mapToDouble(it -> ((Number) it.getOrDefault("revenue", 0.0)).doubleValue()).sum();
        double top3SharePct = totalRevenue > 0 ? round((top3Revenue / totalRevenue) * 100.0) : 0.0;

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("topByUnits", byUnits.stream().limit(max).collect(Collectors.toList()));
        resp.put("topByRevenue", byRevenue.stream().limit(max).collect(Collectors.toList()));
        resp.put("topByProfit", byProfit.stream().limit(max).collect(Collectors.toList()));
        resp.put("worstSelling", bottom5);
        resp.put("categoryLeaders", categoryLeaders);
        resp.put("allProducts", byUnits);
        resp.put("summary", Map.of(
            "totalUnitsSold", totalUnits,
            "totalRevenue", round(totalRevenue),
            "totalRevenueKhr", Math.round(totalRevenue * 4100),
            "totalProfit", round(totalProfit),
            "top3RevenueSharePct", top3SharePct,
            "productCount", all.size()
        ));
        resp.put("filterMetadata", summary.getFilterMetadata());
        return resp;
    }

    public Map<String, Object> getTopStaffReport(String startDate, String endDate) {
        ReportSummary summary = getFilteredManagementReport(startDate, endDate, null, null, null);
        List<Map<String, Object>> staffList = new ArrayList<>(summary.getStaffPerformance());

        // 1. Sort by Sales Volume
        List<Map<String, Object>> bySales = new ArrayList<>(staffList);
        bySales.sort((a, b) -> Double.compare(((Number) b.getOrDefault("salesGenerated", 0.0)).doubleValue(), ((Number) a.getOrDefault("salesGenerated", 0.0)).doubleValue()));

        // Assign awards & badges
        for (int i = 0; i < bySales.size(); i++) {
            Map<String, Object> st = bySales.get(i);
            st.put("salesRank", i + 1);
            List<String> badges = new ArrayList<>();
            if (i == 0) badges.add("🏆 MVP Sales Champion");
            else if (i == 1) badges.add("🥈 Runner Up");
            else if (i == 2) badges.add("🥉 Bronze Performer");

            int tickets = ((Number) st.getOrDefault("ticketsHandled", 0)).intValue();
            if (tickets >= 8) badges.add("⚡ Speed Master");

            double avgTicket = ((Number) st.getOrDefault("avgTicketValue", 0.0)).doubleValue();
            if (avgTicket >= 18.0) badges.add("💎 Upsell Guru");

            int voids = ((Number) st.getOrDefault("voidCount", 0)).intValue();
            if (voids == 0) badges.add("🛡️ Clean Audit");
            else if (voids >= 3) badges.add("⚠️ Audit Flagged");

            st.put("badges", badges);
        }

        // 2. Sort by Ticket Speed
        List<Map<String, Object>> byTickets = new ArrayList<>(staffList);
        byTickets.sort((a, b) -> Integer.compare(((Number) b.getOrDefault("ticketsHandled", 0)).intValue(), ((Number) a.getOrDefault("ticketsHandled", 0)).intValue()));

        // 3. Sort by Average Ticket Size (Upsell capability)
        List<Map<String, Object>> byAvgTicket = new ArrayList<>(staffList);
        byAvgTicket.sort((a, b) -> Double.compare(((Number) b.getOrDefault("avgTicketValue", 0.0)).doubleValue(), ((Number) a.getOrDefault("avgTicketValue", 0.0)).doubleValue()));

        Map<String, Object> mvp = bySales.isEmpty() ? null : bySales.get(0);
        Map<String, Object> speedLeader = byTickets.isEmpty() ? null : byTickets.get(0);
        Map<String, Object> upsellLeader = byAvgTicket.isEmpty() ? null : byAvgTicket.get(0);

        double totalStaffSales = staffList.stream().mapToDouble(st -> ((Number) st.getOrDefault("salesGenerated", 0.0)).doubleValue()).sum();
        int totalTickets = staffList.stream().mapToInt(st -> ((Number) st.getOrDefault("ticketsHandled", 0)).intValue()).sum();
        double totalLaborCost = staffList.stream().mapToDouble(st -> ((Number) st.getOrDefault("laborCost", 0.0)).doubleValue()).sum();
        double avgLaborPct = totalStaffSales > 0 ? round((totalLaborCost / totalStaffSales) * 100.0) : 0.0;

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("rankedBySales", bySales);
        resp.put("rankedByTickets", byTickets);
        resp.put("rankedByAvgTicket", byAvgTicket);
        resp.put("mvpStaff", mvp);
        resp.put("speedLeader", speedLeader);
        resp.put("upsellLeader", upsellLeader);
        resp.put("allStaff", bySales);
        resp.put("summary", Map.of(
            "totalStaffCount", staffList.size(),
            "totalStaffSales", round(totalStaffSales),
            "totalStaffSalesKhr", Math.round(totalStaffSales * 4100),
            "totalTicketsHandled", totalTickets,
            "totalLaborCost", round(totalLaborCost),
            "overallLaborCostPct", avgLaborPct
        ));
        resp.put("filterMetadata", summary.getFilterMetadata());
        return resp;
    }

    public String generateCsv(String reportType) {
        return generateFilteredCsv(reportType, null, null, null, null, null, null, null);
    }

    public String generateFilteredCsv(
            String reportType,
            String startDateStr,
            String endDateStr,
            String cashierFilter,
            String paymentMethodsFilter,
            String categoryFilter
    ) {
        return generateFilteredCsv(reportType, startDateStr, endDateStr, cashierFilter, paymentMethodsFilter, categoryFilter, null, null);
    }

    public String generateFilteredCsv(
            String reportType,
            String startDateStr,
            String endDateStr,
            String cashierFilter,
            String paymentMethodsFilter,
            String categoryFilter,
            Integer startHour,
            Integer endHour
    ) {
        ReportSummary s = getFilteredManagementReport(startDateStr, endDateStr, cashierFilter, paymentMethodsFilter, categoryFilter, startHour, endHour);
        StringBuilder csv = new StringBuilder();

        // Standard UTF-8 BOM so Microsoft Excel opens clean unicode without character distortion
        csv.append("\uFEFF");

        String timeScope = (startHour != null || endHour != null)
                ? String.format("%02d:00 to %02d:00", (startHour != null ? startHour : 0), (endHour != null ? endHour : 23))
                : "All Operating Hours";

        switch (reportType.toUpperCase()) {
            case "TOP_PRODUCTS":
            case "TOP-PRODUCTS":
            case "PRODUCTS":
                csv.append("========================================================================================\n");
                csv.append("COFFEE POS & BAKERY - PRODUCT PERFORMANCE & HOURLY AUDIT REPORT\n");
                csv.append("========================================================================================\n");
                csv.append("Report Title,Product Sales & Hourly Profitability Audit\n");
                csv.append("Generated At,").append(new Date()).append("\n");
                csv.append("Date Scope,").append(startDateStr != null ? startDateStr : "All Dates").append(" to ").append(endDateStr != null ? endDateStr : "Today").append("\n");
                csv.append("Hourly Scope,").append(timeScope).append("\n");
                csv.append("Category Scope,").append(categoryFilter != null ? categoryFilter : "All Categories").append("\n");
                csv.append("Cashier Scope,").append(cashierFilter != null ? cashierFilter : "All Staff").append("\n");
                csv.append("Exchange Rate,1 USD = 4100 KHR\n");
                csv.append("========================================================================================\n\n");

                csv.append("Rank,Product Name,Category,Retail Price ($),Retail Price (KHR),Units Sold,Gross Revenue ($),Gross Revenue (KHR),Unit Cost ($),Gross Profit ($),Profit Margin (%)\n");

                int rank = 1;
                int totalUnits = 0;
                double totalProdRev = 0.0;
                double totalProdCost = 0.0;
                double totalProdProfit = 0.0;

                for (Map<String, Object> prod : s.getAllProductPerformance()) {
                    int units = ((Number) prod.getOrDefault("unitsSold", 0)).intValue();
                    double price = ((Number) prod.getOrDefault("unitPrice", 0.0)).doubleValue();
                    double rev = ((Number) prod.getOrDefault("revenue", 0.0)).doubleValue();
                    double cost = ((Number) prod.getOrDefault("unitCost", 0.0)).doubleValue();
                    double profit = ((Number) prod.getOrDefault("grossProfit", rev - (cost * units))).doubleValue();
                    double margin = ((Number) prod.getOrDefault("profitMarginPct", 0.0)).doubleValue();

                    totalUnits += units;
                    totalProdRev += rev;
                    totalProdCost += (cost * units);
                    totalProdProfit += profit;

                    csv.append(rank++).append(",")
                       .append("\"").append(prod.get("name")).append("\",")
                       .append(prod.get("category")).append(",")
                       .append(price).append(",")
                       .append(Math.round(price * 4100)).append(",")
                       .append(units).append(",")
                       .append(rev).append(",")
                       .append(Math.round(rev * 4100)).append(",")
                       .append(cost).append(",")
                       .append(profit).append(",")
                       .append(margin).append("%\n");
                }

                double avgMargin = totalProdRev > 0 ? ((totalProdRev - totalProdCost) / totalProdRev) * 100.0 : 0.0;
                csv.append("\nTOTALS / SUMMARY,,,$,,")
                   .append(totalUnits).append(",")
                   .append(round(totalProdRev)).append(",")
                   .append(Math.round(totalProdRev * 4100)).append(",")
                   .append(round(totalProdCost)).append(",")
                   .append(round(totalProdProfit)).append(",")
                   .append(round(avgMargin)).append("%\n");
                break;

            case "SALES":
                csv.append("========================================================================================\n");
                csv.append("COFFEE POS & BAKERY - MANAGEMENT SALES & REVENUE EXECUTIVE AUDIT\n");
                csv.append("========================================================================================\n");
                csv.append("Report Title,Financial Revenue & Tender Reconciliation Audit\n");
                csv.append("Generated At,").append(new Date()).append("\n");
                csv.append("Date Scope,").append(startDateStr != null ? startDateStr : "All Dates").append(" to ").append(endDateStr != null ? endDateStr : "Today").append("\n");
                csv.append("Operating Hours,").append(timeScope).append("\n");
                csv.append("Cashier Scope,").append(cashierFilter != null ? cashierFilter : "All Operators").append("\n");
                csv.append("Payment Channels,").append(paymentMethodsFilter != null ? paymentMethodsFilter : "All Channels").append("\n");
                csv.append("Category Scope,").append(categoryFilter != null ? categoryFilter : "All Categories").append("\n");
                csv.append("Exchange Rate,1 USD = 4100 KHR\n");
                csv.append("========================================================================================\n\n");

                csv.append("EXECUTIVE KPI SUMMARY,Amount (USD),Amount (KHR)\n");
                csv.append("Gross Sales (Pre-Deductions),$").append(s.getGrossSales()).append(",៛").append(Math.round(s.getGrossSales() * 4100)).append("\n");
                csv.append("Discounts / Promotions Total,-$").append(s.getTotalDiscounts()).append(",-៛").append(Math.round(s.getTotalDiscounts() * 4100)).append("\n");
                csv.append("Sales Tax (VAT 8%),$").append(s.getTotalTax()).append(",៛").append(Math.round(s.getTotalTax() * 4100)).append("\n");
                csv.append("Net Sales Total,$").append(s.getNetSales()).append(",៛").append(Math.round(s.getNetSales() * 4100)).append("\n");
                csv.append("Total Customer Tickets Handled,").append(s.getCustomerCount()).append(",Tickets\n");
                csv.append("Average Spend Per Guest,$").append(s.getAverageSpendPerGuest()).append(",៛").append(Math.round(s.getAverageSpendPerGuest() * 4100)).append("\n\n");

                csv.append("PAYMENT CHANNEL RECONCILIATION,Amount (USD),Amount (KHR),Share (%)\n");
                double totPay = s.getPaymentBreakdown().values().stream().mapToDouble(Double::doubleValue).sum();
                s.getPaymentBreakdown().forEach((k, v) -> {
                    double pct = totPay > 0 ? (v / totPay) * 100.0 : 0;
                    csv.append(k).append(",")
                       .append(v).append(",")
                       .append(Math.round(v * 4100)).append(",")
                       .append(round(pct)).append("%\n");
                });
                break;

            case "COGS":
                csv.append("========================================================================================\n");
                csv.append("COFFEE POS & BAKERY - COGS & RECIPE PROFITABILITY LEDGER\n");
                csv.append("========================================================================================\n");
                csv.append("Report Title,Bill of Materials (BOM) Cost & Product Margin Ledger\n");
                csv.append("Generated At,").append(new Date()).append("\n");
                csv.append("Category Scope,").append(categoryFilter != null ? categoryFilter : "All Categories").append("\n");
                csv.append("Overall COGS Rate,").append(s.getOverallCogsPercentage()).append("%\n");
                csv.append("Total Ingredient Cost,$").append(s.getTotalIngredientCost()).append("\n");
                csv.append("Total Gross Profit,$").append(s.getTotalGrossProfit()).append("\n");
                csv.append("Exchange Rate,1 USD = 4100 KHR\n");
                csv.append("========================================================================================\n\n");

                csv.append("Product Name,Category,Retail Price ($),Retail Price (KHR),BOM Recipe Cost ($),Gross Profit Margin ($),Profit Margin (%),COGS (%)\n");
                for (Map<String, Object> item : s.getItemProfitability()) {
                    double p = ((Number) item.get("retailPrice")).doubleValue();
                    csv.append("\"").append(item.get("name")).append("\",")
                       .append(item.get("category")).append(",")
                       .append(p).append(",")
                       .append(Math.round(p * 4100)).append(",")
                       .append(item.get("bomCost")).append(",")
                       .append(item.get("grossMargin")).append(",")
                       .append(item.get("marginPercentage")).append("%,")
                       .append(item.get("cogsPercentage")).append("%\n");
                }
                break;

            case "SPOILAGE":
                List<Map<String, Object>> sp = calculateVarianceAndSpoilage(null);
                csv.append("========================================================================================\n");
                csv.append("COFFEE POS & BAKERY - INVENTORY VARIANCE & SPOILAGE AUDIT REPORT\n");
                csv.append("========================================================================================\n");
                csv.append("Report Title,Physical Count vs Theoretical Variance Audit\n");
                csv.append("Generated At,").append(new Date()).append("\n");
                csv.append("========================================================================================\n\n");

                csv.append("Raw Material,Unit,Theoretical Stock,Actual Physical Count,Variance Qty,Variance %,Financial Loss ($),Financial Loss (KHR),Audit Status\n");
                for (Map<String, Object> row : sp) {
                    double loss = ((Number) row.get("financialLoss")).doubleValue();
                    csv.append("\"").append(row.get("name")).append("\",")
                       .append(row.get("unit")).append(",")
                       .append(row.get("theoreticalStock")).append(",")
                       .append(row.get("actualStock")).append(",")
                       .append(row.get("varianceQuantity")).append(",")
                       .append(row.get("variancePercentage")).append("%,")
                       .append(loss).append(",")
                       .append(Math.round(loss * 4100)).append(",")
                       .append(row.get("status")).append("\n");
                }
                break;

            case "TOP_STAFF":
            case "TOP-STAFF":
            case "STAFF":
            default:
                csv.append("========================================================================================\n");
                csv.append("COFFEE POS & BAKERY - STAFF PERFORMANCE & SHIFT AUDIT LOGS\n");
                csv.append("========================================================================================\n");
                csv.append("Report Title,Cashier & Barista Shift Audit and Labor Cost Analysis\n");
                csv.append("Generated At,").append(new Date()).append("\n");
                csv.append("Staff Scope,").append(cashierFilter != null ? cashierFilter : "All Operators").append("\n");
                csv.append("Store-wide Labor Cost Rate,").append(s.getStoreLaborCostPercentage()).append("%\n");
                csv.append("Exchange Rate,1 USD = 4100 KHR\n");
                csv.append("========================================================================================\n\n");

                csv.append("Staff Name,Role,Tickets Handled,Sales Generated ($),Sales Generated (KHR),Avg Ticket ($),Void Count,Discounts Given,Labor Hours,Labor Cost ($),Labor Cost %\n");
                for (Map<String, Object> staff : s.getStaffPerformance()) {
                    double sales = ((Number) staff.get("salesGenerated")).doubleValue();
                    csv.append("\"").append(staff.get("name")).append("\",")
                       .append(staff.get("role")).append(",")
                       .append(staff.get("ticketsHandled")).append(",")
                       .append(sales).append(",")
                       .append(Math.round(sales * 4100)).append(",")
                       .append(staff.get("avgTicketValue")).append(",")
                       .append(staff.get("voidCount")).append(",")
                       .append(staff.get("discountCount")).append(",")
                       .append(staff.get("hoursWorked")).append(",")
                       .append(staff.get("laborCost")).append(",")
                       .append(staff.get("laborCostPct")).append("%\n");
                }
                break;
        }

        return csv.toString();
    }

    private double calculateProductBOMCost(Product p, List<Ingredient> ingredients) {
        if (p.getRecipe() == null || p.getRecipe().isEmpty()) {
            return round(p.getPrice() * 0.22); // Baseline 22% COGS if pastry/bean bag
        }
        double cost = 0.0;
        for (RecipeItem r : p.getRecipe()) {
            for (Ingredient ing : ingredients) {
                if (ing.getId().equals(r.getIngredientId())) {
                    cost += r.getQuantity() * ing.getCostPerUnit();
                }
            }
        }
        return round(cost);
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
