package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BakongConfig {

    @Value("${bakong.api.url:https://api-bakong.nbc.gov.kh}")
    private String apiUrl;

    @Value("${bakong.token}")
    private String token;

    @Value("${bakong.merchant.id:sophara_len@bkrt}")
    private String merchantId;

    @Value("${bakong.merchant.name:COFFEE POS}")
    private String merchantName;

    @Value("${bakong.merchant.city:Phnom Penh}")
    private String merchantCity;

    @Value("${bakong.acquiring.bank:Bakong}")
    private String acquiringBank;

    @Value("${telegram.enabled:true}")
    private boolean telegramEnabled;

    @Value("${telegram.bot.token:${TELEGRAM_BOT_TOKEN:}}")
    private String telegramBotToken;

    @Value("${telegram.chat.id:${TELEGRAM_CHAT_ID:}}")
    private String telegramChatId;

    public String getApiUrl() { return apiUrl; }
    public String getToken() { return token; }
    public String getMerchantId() { return merchantId; }
    public String getMerchantName() { return merchantName; }
    public String getMerchantCity() { return merchantCity; }
    public String getAcquiringBank() { return acquiringBank; }

    public boolean isTelegramEnabled() { return telegramEnabled; }
    public String getTelegramBotToken() { return telegramBotToken; }
    public String getTelegramChatId() { return telegramChatId; }
}
