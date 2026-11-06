package com.example.demo.controller;

import com.example.demo.config.BakongConfig;
import com.example.demo.service.BakongService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bakong")
public class BakongController {

    private final BakongService bakongService;
    private final BakongConfig bakongConfig;

    public BakongController(BakongService bakongService, BakongConfig bakongConfig) {
        this.bakongService = bakongService;
        this.bakongConfig = bakongConfig;
    }

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of(
                "merchantId", bakongConfig.getMerchantId(),
                "merchantName", bakongConfig.getMerchantName(),
                "merchantCity", bakongConfig.getMerchantCity(),
                "acquiringBank", bakongConfig.getAcquiringBank(),
                "telegramEnabled", bakongConfig.isTelegramEnabled()
        ));
    }

    @PostMapping("/generate-qr")
    public ResponseEntity<?> generateQr(@RequestBody Map<String, Object> body) {
        String billNumber = (String) body.getOrDefault("billNumber", "ORD-" + System.currentTimeMillis() % 10000);
        double amount = 0.0;
        if (body.get("amount") instanceof Number) {
            amount = ((Number) body.get("amount")).doubleValue();
        } else if (body.get("amount") instanceof String) {
            try {
                amount = Double.parseDouble((String) body.get("amount"));
            } catch (Exception ignored) {}
        }

        String currency = (String) body.getOrDefault("currency", "USD");

        Map<String, Object> qrData = bakongService.generateKhqr(billNumber, amount, currency);
        return ResponseEntity.ok(qrData);
    }

    @PostMapping("/check-payment")
    public ResponseEntity<?> checkPayment(@RequestBody Map<String, String> body) {
        String md5 = body.get("md5");
        Map<String, Object> result = bakongService.checkTransactionByMd5(md5);
        return ResponseEntity.ok(result);
    }
}
