package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    public FileUploadController() {
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @PostMapping
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File is empty"));
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        } else {
            extension = ".jpg";
        }

        // Validate basic image extension
        if (!extension.matches("\\.(jpg|jpeg|png|webp|gif|svg)$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Only real image files (JPG, PNG, WEBP, GIF, SVG) are allowed"));
        }

        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            String newFilename = "img_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16) + extension;
            Path targetLocation = uploadDir.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("imageUrl", "/uploads/" + newFilename);
            resp.put("filename", newFilename);
            resp.put("originalName", originalFilename);
            resp.put("size", file.getSize());

            return ResponseEntity.ok(resp);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to store image: " + e.getMessage()));
        }
    }

    @PostMapping("/base64")
    public ResponseEntity<?> uploadBase64Image(@RequestBody Map<String, String> body) {
        String base64Data = body.get("image");
        if (base64Data == null || base64Data.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Image data is required"));
        }

        String extension = ".jpg";
        String cleanBase64 = base64Data;
        if (base64Data.contains(",")) {
            String header = base64Data.substring(0, base64Data.indexOf(",")).toLowerCase();
            cleanBase64 = base64Data.substring(base64Data.indexOf(",") + 1);
            if (header.contains("png")) extension = ".png";
            else if (header.contains("webp")) extension = ".webp";
        }

        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64.trim());
            String newFilename = "img_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16) + extension;
            Path targetLocation = uploadDir.resolve(newFilename);
            Files.write(targetLocation, imageBytes);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("imageUrl", "/uploads/" + newFilename);
            resp.put("filename", newFilename);
            resp.put("size", imageBytes.length);

            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException | IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Failed to process base64 image: " + e.getMessage()));
        }
    }
}
