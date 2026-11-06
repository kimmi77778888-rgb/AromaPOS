package com.example.demo.service;

import com.example.demo.model.Order;
import com.example.demo.model.Shift;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ShiftService {

    private final OrderService orderService;
    private final TelegramService telegramService;
    private final List<Shift> shifts = new CopyOnWriteArrayList<>();

    public ShiftService(OrderService orderService, TelegramService telegramService) {
        this.orderService = orderService;
        this.telegramService = telegramService;
        initializeDefaultShifts();
    }

    private void initializeDefaultShifts() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Completed Shift Yesterday Morning (Chloe Chen)
        Shift s1 = new Shift("shf-001", "SHIFT-20261023-01", "usr-4", "Chloe Chen", "CASHIER",
                "Register #1 - Main Bar", 100.00, "Morning register opening count verified.");
        s1.setOpenedAt(now.minusDays(1).withHour(7).withMinute(30));
        s1.setClosedAt(now.minusDays(1).withHour(15).withMinute(0));
        s1.setStatus("CLOSED");
        s1.setClosedBy("Sophia Bennett");
        s1.setCashSales(245.50);
        s1.setCardSales(180.00);
        s1.setQrSales(312.00);
        s1.setTotalGrossSales(737.50);
        s1.setTotalOrders(42);
        s1.setRefunds(0.0);
        s1.setExpectedCash(345.50);
        s1.setActualCashCount(345.50);
        s1.setVariance(0.0);
        s1.setVarianceStatus("BALANCED");
        s1.setClosingNotes("All drawers counted and reconciled with register tapes.");

        // 2. Completed Shift Yesterday Evening (Liam Vance)
        Shift s2 = new Shift("shf-002", "SHIFT-20261023-02", "usr-1", "Liam Vance", "BARISTA",
                "Register #1 - Main Bar", 100.00, "Evening shift handover.");
        s2.setOpenedAt(now.minusDays(1).withHour(15).withMinute(0));
        s2.setClosedAt(now.minusDays(1).withHour(22).withMinute(30));
        s2.setStatus("CLOSED");
        s2.setClosedBy("Liam Vance");
        s2.setCashSales(192.00);
        s2.setCardSales(145.50);
        s2.setQrSales(280.00);
        s2.setTotalGrossSales(617.50);
        s2.setTotalOrders(36);
        s2.setRefunds(0.0);
        s2.setExpectedCash(292.00);
        s2.setActualCashCount(294.00);
        s2.setVariance(2.00);
        s2.setVarianceStatus("OVERAGE");
        s2.setClosingNotes("Slight cash overage from tip jar drop.");

        // 3. Completed Shift 2 Days Ago (Sophia Bennett)
        Shift s3 = new Shift("shf-003", "SHIFT-20261022-01", "usr-2", "Sophia Bennett", "MANAGER",
                "Register #2 - Express Takeaway", 120.00, "Opening float with extra $1 bills.");
        s3.setOpenedAt(now.minusDays(2).withHour(8).withMinute(0));
        s3.setClosedAt(now.minusDays(2).withHour(16).withMinute(0));
        s3.setStatus("CLOSED");
        s3.setClosedBy("Sophia Bennett");
        s3.setCashSales(310.00);
        s3.setCardSales(220.00);
        s3.setQrSales(440.00);
        s3.setTotalGrossSales(970.00);
        s3.setTotalOrders(58);
        s3.setRefunds(5.00);
        s3.setExpectedCash(425.00);
        s3.setActualCashCount(424.00);
        s3.setVariance(-1.00);
        s3.setVarianceStatus("SHORTAGE");
        s3.setClosingNotes("Minor change discrepancy on cash return.");

        // 4. Completed Earlier Shift (Liam Vance) - CLOSED
        Shift s4 = new Shift("shf-004", "SHIFT-" + now.toLocalDate().toString().replace("-", "") + "-01", 
                "usr-1", "Liam Vance", "BARISTA", "Register #1 - Main Bar", 100.00, "Morning shift handover and reconciled.");
        s4.setOpenedAt(now.minusHours(6));
        s4.setClosedAt(now.minusMinutes(45));
        s4.setStatus("CLOSED");
        s4.setClosedBy("Sophia Bennett");
        s4.setCashSales(165.50);
        s4.setCardSales(110.00);
        s4.setQrSales(195.00);
        s4.setTotalGrossSales(470.50);
        s4.setTotalOrders(28);
        s4.setRefunds(0.0);
        s4.setExpectedCash(265.50);
        s4.setActualCashCount(265.50);
        s4.setVariance(0.0);
        s4.setVarianceStatus("BALANCED");
        s4.setClosingNotes("Previous shift closed and verified.");

        shifts.add(0, s4);
        shifts.add(s1);
        shifts.add(s2);
        shifts.add(s3);

        // By default, store starts CLOSED until a cashier officially opens the register
        orderService.setStoreOpen(false);
    }

    public List<Shift> getAllShifts() {
        // Update active shift metrics dynamically from live orders
        updateActiveShiftMetrics();
        return new ArrayList<>(shifts);
    }

    public Optional<Shift> getActiveShift() {
        updateActiveShiftMetrics();
        return shifts.stream().filter(s -> "OPEN".equalsIgnoreCase(s.getStatus())).findFirst();
    }

    public Optional<Shift> getShiftById(String id) {
        updateActiveShiftMetrics();
        return shifts.stream().filter(s -> s.getId().equalsIgnoreCase(id) || s.getShiftNumber().equalsIgnoreCase(id)).findFirst();
    }

    public synchronized Shift openShift(String staffId, String staffName, String staffRole, 
                                        String registerName, double startingFloat, String openingNotes) {
        // Close any currently lingering open shift
        getActiveShift().ifPresent(active -> {
            closeShift(active.getId(), active.getExpectedCash(), staffName, "Auto-closed on opening new shift", null);
        });

        String shiftNum = "SHIFT-" + java.time.LocalDate.now().toString().replace("-", "") + "-" + String.format("%02d", shifts.size() + 1);
        String shiftId = "shf-" + System.currentTimeMillis();

        Shift newShift = new Shift(
                shiftId,
                shiftNum,
                staffId != null ? staffId : "usr-staff",
                staffName != null ? staffName : "Cashier",
                staffRole != null ? staffRole : "CASHIER",
                registerName != null && !registerName.isBlank() ? registerName : "Register #1 - Main Bar",
                startingFloat > 0 ? startingFloat : 100.00,
                openingNotes != null ? openingNotes : "Register drawer opened with starting float."
        );

        orderService.setCurrentShiftCashier(newShift.getStaffName());
        orderService.setStartingFloat(newShift.getStartingFloat());
        orderService.setStoreOpen(true);

        shifts.add(0, newShift);

        // Send Telegram alert
        telegramService.sendMessage(
                "🟢 <b>REGISTER SHIFT OPENED</b>\n" +
                "━━━━━━━━━━━━━━━━━━━━━\n" +
                "👤 <b>Operator:</b> " + newShift.getStaffName() + " (" + newShift.getStaffRole() + ")\n" +
                "💻 <b>Terminal:</b> " + newShift.getRegisterName() + "\n" +
                "💵 <b>Starting Float:</b> $" + String.format(Locale.US, "%.2f", newShift.getStartingFloat()) + "\n" +
                "🕒 <b>Opened:</b> " + LocalDateTime.now().toString().replace("T", " ").substring(0, 19)
        );

        return newShift;
    }

    public synchronized Shift closeShift(String shiftId, double physicalCashCount, String closedBy, 
                                         String closingNotes, Map<String, Object> denoms) {
        Optional<Shift> opt = shifts.stream().filter(s -> s.getId().equalsIgnoreCase(shiftId)).findFirst();
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Shift not found with ID: " + shiftId);
        }

        Shift shift = opt.get();
        if ("CLOSED".equalsIgnoreCase(shift.getStatus())) {
            return shift; // Already closed
        }

        // Calculate live financial aggregates from orders placed
        updateShiftFinancials(shift);

        double expected = shift.getExpectedCash();
        double variance = Math.round((physicalCashCount - expected) * 100.0) / 100.0;

        shift.setClosedAt(LocalDateTime.now());
        shift.setStatus("CLOSED");
        shift.setClosedBy(closedBy != null ? closedBy : shift.getStaffName());
        shift.setActualCashCount(physicalCashCount);
        shift.setVariance(variance);
        shift.setVarianceStatus(variance == 0 ? "BALANCED" : (variance > 0 ? "OVERAGE" : "SHORTAGE"));
        shift.setClosingNotes(closingNotes != null ? closingNotes : "Shift reconciled and closed.");
        if (denoms != null) {
            shift.setDenominations(denoms);
        }

        // Update store open state in OrderService
        boolean anyOpen = shifts.stream().anyMatch(s -> "OPEN".equalsIgnoreCase(s.getStatus()) && !s.getId().equalsIgnoreCase(shiftId));
        orderService.setStoreOpen(anyOpen);

        // Send instant Telegram Z-Report shift closure notification
        telegramService.sendZReportNotification(
                shift.getStaffName(),
                shift.getTotalGrossSales(),
                shift.getCashSales(),
                shift.getQrSales(),
                shift.getTotalOrders(),
                variance
        );

        return shift;
    }

    public synchronized Shift recordCashMovement(String shiftId, String type, double amount, String reason, String performedBy) {
        Shift shift = shifts.stream()
                .filter(s -> s.getId().equalsIgnoreCase(shiftId) || s.getShiftNumber().equalsIgnoreCase(shiftId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Shift not found: " + shiftId));

        if ("CLOSED".equalsIgnoreCase(shift.getStatus())) {
            throw new IllegalStateException("Cannot add cash movements to an already closed shift");
        }

        Map<String, Object> movement = new HashMap<>();
        movement.put("id", "mov-" + System.currentTimeMillis());
        movement.put("type", type);
        movement.put("amount", amount);
        movement.put("reason", reason);
        movement.put("performedBy", performedBy);
        movement.put("timestamp", LocalDateTime.now().toString());

        shift.getCashMovements().add(movement);
        if ("CASH_IN".equalsIgnoreCase(type) || "PAY_IN".equalsIgnoreCase(type)) {
            shift.setPayIns(Math.round((shift.getPayIns() + amount) * 100.0) / 100.0);
        } else {
            shift.setPayOuts(Math.round((shift.getPayOuts() + amount) * 100.0) / 100.0);
        }

        updateShiftFinancials(shift);

        telegramService.sendMessage(
                "💸 <b>CASH DRAWER MOVEMENT (" + type + ")</b>\n" +
                "━━━━━━━━━━━━━━━━━━━━━\n" +
                "👤 <b>Operator:</b> " + performedBy + "\n" +
                "💵 <b>Amount:</b> $" + String.format(Locale.US, "%.2f", amount) + "\n" +
                "📝 <b>Reason:</b> " + reason + "\n" +
                "💰 <b>New Expected Cash:</b> $" + String.format(Locale.US, "%.2f", shift.getExpectedCash())
        );

        return shift;
    }

    private void updateActiveShiftMetrics() {
        shifts.stream().filter(s -> "OPEN".equalsIgnoreCase(s.getStatus())).forEach(this::updateShiftFinancials);
    }

    private void updateShiftFinancials(Shift shift) {
        if ("CLOSED".equalsIgnoreCase(shift.getStatus())) return;

        List<Order> allOrders = orderService.getAllOrders();
        // Sum orders since shift was opened
        LocalDateTime opened = shift.getOpenedAt();

        double cash = 0.0;
        double card = 0.0;
        double qr = 0.0;
        double gross = 0.0;
        int count = 0;

        for (Order o : allOrders) {
            cash += "CASH".equalsIgnoreCase(o.getPaymentMethod()) ? o.getTotal() : 0.0;
            card += "CARD".equalsIgnoreCase(o.getPaymentMethod()) ? o.getTotal() : 0.0;
            qr += ("KHQR".equalsIgnoreCase(o.getPaymentMethod()) || "QR_CODE".equalsIgnoreCase(o.getPaymentMethod())) ? o.getTotal() : 0.0;
            gross += o.getTotal();
            count++;
        }

        shift.setCashSales(Math.round(cash * 100.0) / 100.0);
        shift.setCardSales(Math.round(card * 100.0) / 100.0);
        shift.setQrSales(Math.round(qr * 100.0) / 100.0);
        shift.setTotalGrossSales(Math.round(gross * 100.0) / 100.0);
        shift.setTotalOrders(count);
        shift.setExpectedCash(Math.round((shift.getStartingFloat() + cash + shift.getPayIns() - shift.getPayOuts() - shift.getRefunds()) * 100.0) / 100.0);
    }

    public boolean isStoreOpen() {
        return shifts.stream().anyMatch(s -> "OPEN".equalsIgnoreCase(s.getStatus()));
    }
}
