package com.example.demo.controller;

import com.example.demo.model.ReportSummary;
import com.example.demo.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    private boolean isRoleForbidden(String roleHeader, String roleParam) {
        return isRoleForbidden(roleHeader, roleParam, null);
    }

    private boolean isRoleForbidden(String roleHeader, String roleParam, String permissionsHeader) {
        if (permissionsHeader != null && permissionsHeader.contains("canAccessReports")) {
            return false;
        }
        String role = roleHeader != null && !roleHeader.isBlank() ? roleHeader : roleParam;
        if (role == null || role.isBlank()) return false;
        String r = role.trim().toUpperCase();
        return "CASHIER".equals(r) || "BARISTA".equals(r);
    }

    @GetMapping({"", "/full"})
    public ResponseEntity<?> getFullReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Permissions", required = false) String permissionsHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String cashier,
            @RequestParam(required = false) String paymentMethods,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer startHour,
            @RequestParam(required = false) Integer endHour
    ) {
        if (isRoleForbidden(roleHeader, role, permissionsHeader)) {
            String activeRole = roleHeader != null ? roleHeader : role;
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Role '" + activeRole + "' does not have permission to view management reports. Required: ADMIN or MANAGER."
            ));
        }
        return ResponseEntity.ok(reportService.getFilteredManagementReport(startDate, endDate, cashier, paymentMethods, category, startHour, endHour));
    }

    @GetMapping("/sales")
    public ResponseEntity<?> getSalesReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestHeader(value = "X-User-Permissions", required = false) String permissionsHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String cashier,
            @RequestParam(required = false) String paymentMethods,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer startHour,
            @RequestParam(required = false) Integer endHour
    ) {
        if (isRoleForbidden(roleHeader, role, permissionsHeader)) {
            String activeRole = roleHeader != null ? roleHeader : role;
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Role '" + activeRole + "' does not have permission to view sales reports. Required: ADMIN or MANAGER."
            ));
        }

        ReportSummary summary = reportService.getFilteredManagementReport(startDate, endDate, cashier, paymentMethods, category, startHour, endHour);
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("grossSales", summary.getGrossSales());
        resp.put("netSales", summary.getNetSales());
        resp.put("discounts", summary.getTotalDiscounts());
        resp.put("tax", summary.getTotalTax());
        resp.put("customerCount", summary.getCustomerCount());
        resp.put("avgSpend", summary.getAverageSpendPerGuest());
        resp.put("peakHours", summary.getPeakHourData());
        resp.put("paymentBreakdown", summary.getPaymentBreakdown());
        resp.put("topSelling", summary.getTopSellingItems());
        resp.put("worstSelling", summary.getWorstSellingItems());
        resp.put("allProducts", summary.getAllProductPerformance());
        resp.put("filterMetadata", summary.getFilterMetadata());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/cogs")
    public ResponseEntity<?> getCogsReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String category
    ) {
        if (isRoleForbidden(roleHeader, role)) {
            String activeRole = roleHeader != null ? roleHeader : role;
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Role '" + activeRole + "' is unauthorized to inspect COGS."
            ));
        }

        ReportSummary summary = reportService.getFilteredManagementReport(startDate, endDate, null, null, category);
        return ResponseEntity.ok(Map.of(
            "overallCogsPercentage", summary.getOverallCogsPercentage(),
            "totalIngredientCost", summary.getTotalIngredientCost(),
            "totalGrossProfit", summary.getTotalGrossProfit(),
            "itemProfitability", summary.getItemProfitability(),
            "reorderForecast", summary.getReorderForecast(),
            "filterMetadata", summary.getFilterMetadata()
        ));
    }

    @PostMapping("/spoilage")
    public ResponseEntity<?> calculateSpoilage(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestBody(required = false) Map<String, Double> actualPhysicalCounts
    ) {
        if (isRoleForbidden(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Only Manager or Admin can perform physical inventory audits."
            ));
        }
        List<Map<String, Object>> varianceReport = reportService.calculateVarianceAndSpoilage(actualPhysicalCounts);
        return ResponseEntity.ok(varianceReport);
    }

    @GetMapping("/staff-audit")
    public ResponseEntity<?> getStaffAuditReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String cashier
    ) {
        if (isRoleForbidden(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Only Store Manager and Admin can audit staff performance."
            ));
        }

        ReportSummary summary = reportService.getFilteredManagementReport(startDate, endDate, cashier, null, null);
        return ResponseEntity.ok(Map.of(
            "staffPerformance", summary.getStaffPerformance(),
            "storeLaborCostPercentage", summary.getStoreLaborCostPercentage(),
            "filterMetadata", summary.getFilterMetadata()
        ));
    }

    @GetMapping({"/top-products", "/top-selling"})
    public ResponseEntity<?> getTopProductsReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer limit
    ) {
        if (isRoleForbidden(roleHeader, role)) {
            String activeRole = roleHeader != null ? roleHeader : role;
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Role '" + activeRole + "' is unauthorized to inspect top products report."
            ));
        }
        return ResponseEntity.ok(reportService.getTopProductsReport(startDate, endDate, category, limit));
    }

    @GetMapping({"/top-staff", "/staff-ranking"})
    public ResponseEntity<?> getTopStaffReport(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        if (isRoleForbidden(roleHeader, role)) {
            String activeRole = roleHeader != null ? roleHeader : role;
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Role '" + activeRole + "' is unauthorized to inspect top staff performance report."
            ));
        }
        return ResponseEntity.ok(reportService.getTopStaffReport(startDate, endDate));
    }

    @GetMapping("/export/{type}")
    public ResponseEntity<?> exportCsv(
            @PathVariable String type,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String cashier,
            @RequestParam(required = false) String paymentMethods,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer startHour,
            @RequestParam(required = false) Integer endHour
    ) {
        if (isRoleForbidden(roleHeader, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access Denied: Role is unauthorized to download financial CSV reports."
            ));
        }

        String csv = reportService.generateFilteredCsv(type, startDate, endDate, cashier, paymentMethods, category, startHour, endHour);
        String filename = "AromaPOS_" + type.toUpperCase() + "_Filtered_" + System.currentTimeMillis() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
