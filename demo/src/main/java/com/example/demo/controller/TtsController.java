package com.example.demo.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    private final ConcurrentHashMap<String, byte[]> audioCache = new ConcurrentHashMap<>();

    @GetMapping(value = "/khmer", produces = "audio/mpeg")
    public ResponseEntity<byte[]> getKhmerTtsAudio(@RequestParam("text") String text) {
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String cleanText = text.trim();

        // 1. Check in-memory cache
        if (audioCache.containsKey(cleanText)) {
            byte[] cached = audioCache.get(cleanText);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=604800")
                    .body(cached);
        }

        // 2. Fetch from Google Translate TTS
        try {
            String encoded = URLEncoder.encode(cleanText, StandardCharsets.UTF_8);
            String url = "https://translate.google.com/translate_tts?ie=UTF-8&q=" + encoded + "&tl=km&client=tw-ob";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 200 && response.body() != null && response.body().length > 0) {
                byte[] audioBytes = response.body();
                audioCache.put(cleanText, audioBytes);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=604800")
                        .body(audioBytes);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch Khmer TTS for text: " + cleanText + " -> " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
}

