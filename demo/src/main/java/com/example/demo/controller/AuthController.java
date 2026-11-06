package com.example.demo.controller;

import com.example.demo.model.AuditLog;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class PinLoginRequest {
        private String pin;
        public String getPin() { return pin; }
        public void setPin(String pin) { this.pin = pin; }
    }

    public static class ManagerOverrideRequest {
        private String managerPin;
        private String action; // VOID_ITEM, DISCOUNT_OVERRIDE, REFUND, DRAWER_KICK
        private String details;
        private String cashierId;
        private String cashierName;
        private double amount;

        public String getManagerPin() { return managerPin; }
        public void setManagerPin(String managerPin) { this.managerPin = managerPin; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
        public String getCashierId() { return cashierId; }
        public void setCashierId(String cashierId) { this.cashierId = cashierId; }
        public String getCashierName() { return cashierName; }
        public void setCashierName(String cashierName) { this.cashierName = cashierName; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }

    public static class FaceLoginRequest {
        private String staffId;
        private String facePhoto;
        public String getStaffId() { return staffId; }
        public void setStaffId(String staffId) { this.staffId = staffId; }
        public String getFacePhoto() { return facePhoto; }
        public void setFacePhoto(String facePhoto) { this.facePhoto = facePhoto; }
    }

    public static class FaceOverrideRequest {
        private String managerId;
        private String action;
        private String details;
        private String cashierId;
        private String cashierName;
        private double amount;

        public String getManagerId() { return managerId; }
        public void setManagerId(String managerId) { this.managerId = managerId; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
        public String getCashierId() { return cashierId; }
        public void setCashierId(String cashierId) { this.cashierId = cashierId; }
        public String getCashierName() { return cashierName; }
        public void setCashierName(String cashierName) { this.cashierName = cashierName; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        Optional<User> user = authService.authenticate(request.getEmail(), request.getPassword());
        if (user.isPresent()) {
            User u = user.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("token", "jwt-token-demo-" + u.getId() + "-" + System.currentTimeMillis());
            resp.put("user", u);
            return ResponseEntity.ok(resp);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password. Try barista@cafe.com / coffee123"));
    }

    @PostMapping("/pin-login")
    public ResponseEntity<?> pinLogin(@RequestBody PinLoginRequest request) {
        if (request.getPin() == null || request.getPin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "PIN is required"));
        }

        Optional<User> user = authService.authenticatePin(request.getPin());
        if (user.isPresent()) {
            User u = user.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("token", "jwt-token-demo-" + u.getId() + "-" + System.currentTimeMillis());
            resp.put("user", u);
            return ResponseEntity.ok(resp);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid 4-digit PIN code"));
    }

    @PostMapping("/manager-override")
    public ResponseEntity<?> managerOverride(@RequestBody ManagerOverrideRequest request) {
        if (request.getManagerPin() == null || request.getManagerPin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("authorized", false, "message", "Manager PIN is required"));
        }

        Map<String, Object> authResult = authService.verifyManagerOverride(
                request.getManagerPin(),
                request.getAction(),
                request.getDetails(),
                request.getCashierId(),
                request.getCashierName(),
                request.getAmount()
        );

        if ((Boolean) authResult.getOrDefault("authorized", false)) {
            return ResponseEntity.ok(authResult);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(authResult);
        }
    }

    @PostMapping("/face-login")
    public ResponseEntity<?> faceLogin(@RequestBody FaceLoginRequest request) {
        if (request.getStaffId() == null || request.getStaffId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Staff ID or Name is required for Face Biometric match"));
        }

        Optional<User> user = authService.authenticateFace(request.getStaffId());
        if (user.isPresent()) {
            User u = user.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("token", "jwt-face-token-" + u.getId() + "-" + System.currentTimeMillis());
            resp.put("user", u);
            resp.put("authMethod", "FACE_BIOMETRIC");
            return ResponseEntity.ok(resp);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Biometric Face Scan did not match an active enrolled staff member."));
    }

    @PostMapping("/face-override")
    public ResponseEntity<?> faceOverride(@RequestBody FaceOverrideRequest request) {
        if (request.getManagerId() == null || request.getManagerId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("authorized", false, "message", "Manager Face ID profile is required"));
        }

        Map<String, Object> authResult = authService.verifyManagerFaceOverride(
                request.getManagerId(),
                request.getAction(),
                request.getDetails(),
                request.getCashierId(),
                request.getCashierName(),
                request.getAmount()
        );

        if ((Boolean) authResult.getOrDefault("authorized", false)) {
            return ResponseEntity.ok(authResult);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(authResult);
        }
    }

    @PostMapping("/staff/{id}/enroll-face")
    public ResponseEntity<?> enrollFace(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<User> opt = authService.getUserById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User u = opt.get();
        String photo = body.get("facePhoto");
        String faceHash = body.get("faceHash");
        String faceBiometrics = body.get("faceBiometrics");

        // ENFORCE: ONE FACE CAN ONLY BE USED BY 1 ACCOUNT!
        // Check if any OTHER user already has this face photo or biometric hash registered
        Optional<User> duplicateOwner = authService.getAllUsers().stream()
                .filter(other -> !other.getId().equalsIgnoreCase(id) && other.isFaceEnrolled())
                .filter(other -> {
                    if (faceHash != null && !faceHash.isBlank() && faceHash.equals(other.getFaceHash())) {
                        return true;
                    }
                    if (photo != null && !photo.isBlank() && photo.equals(other.getFacePhoto())) {
                        return true;
                    }
                    return false;
                })
                .findFirst();

        if (duplicateOwner.isPresent()) {
            User existing = duplicateOwner.get();
            Map<String, Object> conflictResp = new HashMap<>();
            conflictResp.put("success", false);
            conflictResp.put("conflict", true);
            conflictResp.put("message", "This face is already registered to " + existing.getName() + " (" + existing.getRole() + "). One face can only be used by 1 account.");
            conflictResp.put("existingStaffName", existing.getName());
            conflictResp.put("existingStaffRole", existing.getRole());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(conflictResp);
        }

        u.setFaceEnrolled(true);
        if (photo != null && !photo.isBlank()) {
            u.setFacePhoto(photo);
            if (u.getAvatar() == null || u.getAvatar().isBlank()) {
                u.setAvatar(photo);
            }
        }
        if (faceHash != null && !faceHash.isBlank()) {
            u.setFaceHash(faceHash);
        }
        if (faceBiometrics != null && !faceBiometrics.isBlank()) {
            u.setFaceBiometrics(faceBiometrics);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Biometric Face ID successfully enrolled for " + u.getName(), "user", u));
    }

    @GetMapping({"/users", "/staff"})
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping({"/users/{id}", "/staff/{id}"})
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        Optional<User> u = authService.getUserById(id);
        if (u.isPresent()) {
            return ResponseEntity.ok(u.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping({"/staff", "/users"})
    public ResponseEntity<?> createStaff(@RequestBody User user) {
        String pin = user.getPinCode() != null && !user.getPinCode().isBlank() ? user.getPinCode() : user.getPin();
        if (user.getName() == null || user.getName().isBlank() || user.getRole() == null || pin == null || pin.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, Role, and 4-digit PIN are required"));
        }
        user.setPinCode(pin.trim());
        User created = authService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping({"/staff/{id}", "/users/{id}"})
    public ResponseEntity<?> updateStaff(@PathVariable String id, @RequestBody User user) {
        Optional<User> updated = authService.updateUser(id, user);
        if (updated.isPresent()) {
            return ResponseEntity.ok(updated.get());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping({"/staff/{id}", "/users/{id}"})
    public ResponseEntity<?> deleteStaff(@PathVariable String id) {
        boolean removed = authService.deleteUser(id);
        if (removed) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Staff member removed successfully", "id", id));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(authService.getAuditLogs());
    }
}
