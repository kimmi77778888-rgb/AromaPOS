package com.example.demo.service;

import com.example.demo.config.BakongConfig;
import com.example.demo.util.KhqrGenerator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

@Service
public class BakongService {

    private final BakongConfig bakongConfig;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public BakongService(BakongConfig bakongConfig) {
        this.bakongConfig = bakongConfig;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder().build();
    }

    /**
     * Generates a real dynamic Bakong KHQR code and MD5 inquiry hash.
     */
    public Map<String, Object> generateKhqr(String billNumber, double amount, String currency) {
        if (currency == null || currency.isBlank()) {
            currency = "USD";
        }

        String khqrString = KhqrGenerator.generateDynamicKhqr(
                bakongConfig.getMerchantId(),
                bakongConfig.getMerchantName(),
                bakongConfig.getMerchantCity(),
                bakongConfig.getAcquiringBank(),
                amount,
                currency,
                billNumber,
                "AromaPOS-01"
        );

        String md5 = KhqrGenerator.calculateMd5(khqrString);

        // Standard high-res QR code image URL encoded for the KHQR string
        String qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=" 
                + java.net.URLEncoder.encode(khqrString, java.nio.charset.StandardCharsets.UTF_8);

        // Fetch official NBC Bakong Deeplink so mobile users can tap to open banking apps
        String deepLink = null;
        try {
            String deepLinkUrl = bakongConfig.getApiUrl() + "/v1/generate_deeplink_by_qr";
            Map<String, String> dlBody = new HashMap<>();
            dlBody.put("qr", khqrString);
            String dlPayload = objectMapper.writeValueAsString(dlBody);

            HttpRequest dlReq = HttpRequest.newBuilder()
                    .uri(URI.create(deepLinkUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + bakongConfig.getToken())
                    .POST(HttpRequest.BodyPublishers.ofString(dlPayload))
                    .build();

            HttpResponse<String> dlRes = httpClient.send(dlReq, HttpResponse.BodyHandlers.ofString());
            if (dlRes.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(dlRes.body());
                if (root.path("responseCode").asInt(-1) == 0) {
                    JsonNode dataNode = root.path("data");
                    deepLink = dataNode.path("shortLink").asText(null);
                    if (deepLink == null || deepLink.isBlank()) {
                        deepLink = dataNode.path("fullLink").asText(null);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Bakong deeplink fetch note: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("khqr", khqrString);
        result.put("md5", md5);
        result.put("qrImageUrl", qrImageUrl);
        result.put("deeplink", deepLink);
        result.put("merchantId", bakongConfig.getMerchantId());
        result.put("merchantName", bakongConfig.getMerchantName());
        result.put("merchantCity", bakongConfig.getMerchantCity());
        result.put("amount", amount);
        result.put("currency", currency);
        result.put("billNumber", billNumber);

        return result;
    }

    /**
     * Queries Bakong NBC API to verify if the KHQR transaction has been successfully paid by customer.
     */
    public Map<String, Object> checkTransactionByMd5(String md5) {
        Map<String, Object> responseMap = new HashMap<>();
        if (md5 == null || md5.isBlank()) {
            responseMap.put("paid", false);
            responseMap.put("message", "MD5 hash required");
            return responseMap;
        }

        try {
            String url = bakongConfig.getApiUrl() + "/v1/check_transaction_by_md5";

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("md5", md5.trim().toLowerCase());

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + bakongConfig.getToken())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                int responseCode = root.path("responseCode").asInt(-1);

                // In Bakong API, responseCode == 0 means transaction was successfully paid!
                if (responseCode == 0) {
                    JsonNode dataNode = root.path("data");
                    responseMap.put("paid", true);
                    responseMap.put("status", "SUCCESS");
                    responseMap.put("responseCode", responseCode);
                    responseMap.put("data", dataNode);
                    responseMap.put("hash", dataNode.path("hash").asText(""));
                    responseMap.put("fromAccountId", dataNode.path("fromAccountId").asText(""));
                    responseMap.put("toAccountId", dataNode.path("toAccountId").asText(""));
                    responseMap.put("amount", dataNode.path("amount").asDouble(0.0));
                    responseMap.put("currency", dataNode.path("currency").asText(""));
                    return responseMap;
                } else {
                    responseMap.put("paid", false);
                    responseMap.put("status", "PENDING");
                    responseMap.put("responseCode", responseCode);
                    responseMap.put("message", root.path("responseMessage").asText("Transaction pending or not yet found"));
                    return responseMap;
                }
            } else {
                responseMap.put("paid", false);
                responseMap.put("status", "ERROR");
                responseMap.put("statusCode", response.statusCode());
                responseMap.put("message", "Bakong API HTTP " + response.statusCode());
                return responseMap;
            }
        } catch (Exception e) {
            responseMap.put("paid", false);
            responseMap.put("status", "ERROR");
            responseMap.put("message", "Exception checking transaction: " + e.getMessage());
            return responseMap;
        }
    }
}
