package com.example.demo.service;

import com.example.demo.model.AuditLog;
import com.example.demo.model.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AuthService {
    private final List<User> users = new CopyOnWriteArrayList<>();
    private final List<AuditLog> auditLogs = new CopyOnWriteArrayList<>();

    public AuthService() {
        // Standard Role Hierarchy (Admin, Manager, Cashier, Barista) - Clean start without stock internet model photos
        User u1 = new User(
                "usr-1",
                "Liam Vance",
                "barista@cafe.com",
                "coffee123",
                "1111",
                "BARISTA",
                14.00,
                "ACTIVE",
                "+855 12 345 671",
                "",
                false,
                new ArrayList<>(List.of("canAccessKds", "canAccessOrders"))
        );
        u1.setLastLoginIp("192.168.1.108 (KDS Station)");
        u1.setLastLoginDevice("Tablet • Android 13 (Chrome 122)");
        u1.setLastLoginAt(LocalDateTime.now().minusHours(3).toString());
        u1.setLastLoginMethod("FACE_BIOMETRIC");
        users.add(u1);

        User u2 = new User(
                "usr-2",
                "Sophia Bennett",
                "manager@cafe.com",
                "manager123",
                "2222",
                "MANAGER",
                22.00,
                "ACTIVE",
                "+855 12 345 672",
                "",
                false,
                new ArrayList<>(List.of("canAccessPos", "canAccessKds", "canAccessDashboard", "canAccessInventory", "canAccessOrders", "canAccessReports", "canPerformOverrides", "canSeeExpectedCash", "canManageStaff"))
        );
        u2.setLastLoginIp("192.168.1.102 (Manager Pad)");
        u2.setLastLoginDevice("Tablet • iPad Pro (Safari 17)");
        u2.setLastLoginAt(LocalDateTime.now().minusHours(2).toString());
        u2.setLastLoginMethod("PIN");
        users.add(u2);

        User u3 = new User(
                "usr-3",
                "Marcus Thorne",
                "admin@cafe.com",
                "77778888",
                "77778888",
                "ADMIN",
                28.00,
                "ACTIVE",
                "+855 12 345 673",
                "",
                false,
                new ArrayList<>(List.of("canAccessPos", "canAccessKds", "canAccessDashboard", "canAccessInventory", "canAccessOrders", "canAccessReports", "canPerformOverrides", "canSeeExpectedCash", "canManageStaff", "canEditInventory", "canEditMenu"))
        );
        u3.setLastLoginIp("103.216.54.12 (Public IPv4)");
        u3.setLastLoginDevice("Desktop • Windows 11 (Chrome 124)");
        u3.setLastLoginAt(LocalDateTime.now().minusMinutes(15).toString());
        u3.setLastLoginMethod("PASSWORD");
        users.add(u3);

        User u4 = new User(
                "usr-4",
                "Chloe Chen",
                "cashier@cafe.com",
                "cashier123",
                "4444",
                "CASHIER",
                12.50,
                "ACTIVE",
                "+855 12 345 674",
                "",
                false,
                new ArrayList<>(List.of("canAccessPos", "canAccessOrders"))
        );
        u4.setLastLoginIp("192.168.1.105 (POS Station #01)");
        u4.setLastLoginDevice("POS Terminal • Windows 10 (POS Kiosk)");
        u4.setLastLoginAt(LocalDateTime.now().minusHours(1).toString());
        u4.setLastLoginMethod("PIN");
        users.add(u4);

        User u5 = new User(
                "usr-5",
                "Security Officer",
                "security@cafe.com",
                "security123",
                "5555",
                "SECURITY",
                25.00,
                "ACTIVE",
                "+855 12 345 675",
                "",
                false,
                new ArrayList<>(List.of("canAccessDashboard", "canAccessOrders", "canAccessReports", "canPerformOverrides", "canSeeExpectedCash", "canManageStaff"))
        );
        u5.setLastLoginIp("103.216.54.88 (HQ VPN)");
        u5.setLastLoginDevice("Desktop • macOS Sonoma (Safari 17)");
        u5.setLastLoginAt(LocalDateTime.now().minusHours(5).toString());
        u5.setLastLoginMethod("PASSWORD");
        users.add(u5);

        // Seed realistic Initial Audit Activity
        auditLogs.add(new AuditLog(
                "aud-1",
                "usr-4",
                "Chloe Chen",
                "CASHIER",
                "VOID_ITEM",
                "Voided 1x Smoked Spanish Cortado ($4.25) due to customer change of mind",
                "Sophia Bennett (Manager)",
                4.25
        ));

        auditLogs.add(new AuditLog(
                "aud-2",
                "usr-4",
                "Chloe Chen",
                "CASHIER",
                "DISCOUNT_OVERRIDE",
                "Applied 50% Employee VIP Courtesy Discount on ticket #ORD-1049",
                "Marcus Thorne (Admin)",
                12.50
        ));

        auditLogs.add(new AuditLog(
                "aud-3",
                "usr-1",
                "Liam Vance",
                "BARISTA",
                "SHIFT_CLOSE",
                "Completed morning register reconciliation float $200.00 balanced",
                "Self-Verified",
                0.00
        ));
    }

    public Optional<User> authenticate(String email, String password) {
        return authenticate(email, password, null, null);
    }

    public Optional<User> authenticate(String email, String password, String ipAddress, String deviceInfo) {
        if (email == null || password == null) return Optional.empty();
        String pass = password.trim();
        String mail = email.trim();

        Optional<User> userOpt = users.stream()
                .filter(u -> (u.getEmail().equalsIgnoreCase(mail) || 
                              u.getEmail().equalsIgnoreCase(mail + "@cafe.com") || 
                              (mail.equalsIgnoreCase("admin") && "ADMIN".equalsIgnoreCase(u.getRole()))))
                .filter(u -> (u.getPassword() != null && u.getPassword().equals(pass)) ||
                             (u.getPinCode() != null && u.getPinCode().equals(pass)))
                .findFirst();

        if (userOpt.isPresent()) {
            User u = userOpt.get();
            String ip = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1 (POS Station)";
            String device = (deviceInfo != null && !deviceInfo.isBlank()) ? deviceInfo : "Standard POS Station";
            u.setLastLoginIp(ip);
            u.setLastLoginDevice(device);
            u.setLastLoginAt(LocalDateTime.now().toString());
            u.setLastLoginMethod("PASSWORD");

            recordAudit("LOGIN_SUCCESS", "User authenticated into terminal from " + ip, u.getName() + " (" + u.getRole() + ")", ip, device, "PASSWORD");
            return Optional.of(u);
        } else {
            String ip = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1";
            String device = (deviceInfo != null && !deviceInfo.isBlank()) ? deviceInfo : "Standard POS Station";
            recordAudit("LOGIN_FAILED", "Failed credential verification for: " + mail, "ANONYMOUS", ip, device, "PASSWORD");
            return Optional.empty();
        }
    }

    public Optional<User> authenticatePin(String pin) {
        return authenticatePin(pin, null, null);
    }

    public Optional<User> authenticatePin(String pin, String ipAddress, String deviceInfo) {
        if (pin == null || pin.isBlank()) return Optional.empty();
        String p = pin.trim();
        Optional<User> userOpt = users.stream()
                .filter(u -> u.getPinCode() != null && u.getPinCode().equals(p))
                .findFirst();

        if (userOpt.isPresent()) {
            User u = userOpt.get();
            String ip = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1 (POS Station)";
            String device = (deviceInfo != null && !deviceInfo.isBlank()) ? deviceInfo : "POS Station Touch Screen";
            u.setLastLoginIp(ip);
            u.setLastLoginDevice(device);
            u.setLastLoginAt(LocalDateTime.now().toString());
            u.setLastLoginMethod("PIN");

            recordAudit("PIN_LOGIN_SUCCESS", "POS Terminal unlocked via 4-digit PIN from " + ip, u.getName() + " (" + u.getRole() + ")", ip, device, "PIN");
            return Optional.of(u);
        } else {
            String ip = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1";
            String device = (deviceInfo != null && !deviceInfo.isBlank()) ? deviceInfo : "POS Station Touch Screen";
            recordAudit("PIN_LOGIN_FAILED", "Invalid terminal PIN code attempt", "ANONYMOUS", ip, device, "PIN");
            return Optional.empty();
        }
    }

    public Optional<User> authenticateFace(String staffIdOrName) {
        return authenticateFace(staffIdOrName, null, null);
    }

    public Optional<User> authenticateFace(String staffIdOrName, String ipAddress, String deviceInfo) {
        if (staffIdOrName == null || staffIdOrName.isBlank()) return Optional.empty();
        String target = staffIdOrName.trim();
        Optional<User> userOpt = users.stream()
                .filter(u -> (u.getId().equalsIgnoreCase(target) || u.getName().equalsIgnoreCase(target)) && u.isFaceEnrolled())
                .findFirst();

        if (userOpt.isPresent()) {
            User u = userOpt.get();
            String ip = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1 (POS Station)";
            String device = (deviceInfo != null && !deviceInfo.isBlank()) ? deviceInfo : "Touchless Biometric Camera";
            u.setLastLoginIp(ip);
            u.setLastLoginDevice(device);
            u.setLastLoginAt(LocalDateTime.now().toString());
            u.setLastLoginMethod("FACE_BIOMETRIC");

            recordAudit("FACE_LOGIN_SUCCESS", "Touchless Face ID biometrics verified from " + ip, u.getName() + " (" + u.getRole() + ")", ip, device, "FACE_BIOMETRIC");
            return Optional.of(u);
        } else {
            String ip = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "127.0.0.1";
            String device = (deviceInfo != null && !deviceInfo.isBlank()) ? deviceInfo : "Touchless Biometric Camera";
            recordAudit("FACE_LOGIN_FAILED", "Face biometric match failed for target: " + target, "ANONYMOUS", ip, device, "FACE_BIOMETRIC");
            return Optional.empty();
        }
    }

    public Map<String, Object> verifyManagerFaceOverride(String managerIdOrName, String action, String details, String cashierId, String cashierName, double amount) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> managerOpt = users.stream()
                .filter(u -> (u.getId().equalsIgnoreCase(managerIdOrName.trim()) || u.getName().equalsIgnoreCase(managerIdOrName.trim())) && u.isFaceEnrolled())
                .findFirst();

        if (managerOpt.isEmpty()) {
            result.put("authorized", false);
            result.put("message", "No enrolled Manager face profile recognized. Access Denied.");
            return result;
        }

        User authorizer = managerOpt.get();
        if (!"MANAGER".equalsIgnoreCase(authorizer.getRole()) && !"ADMIN".equalsIgnoreCase(authorizer.getRole()) && !"SECURITY".equalsIgnoreCase(authorizer.getRole())) {
            result.put("authorized", false);
            result.put("message", "Unauthorized Role: " + authorizer.getRole() + ". Only Managers, Admins, and Security Officers can authorize overrides.");
            return result;
        }

        if (!"ACTIVE".equalsIgnoreCase(authorizer.getStatus())) {
            result.put("authorized", false);
            result.put("message", "Manager account is inactive.");
            return result;
        }

        String authorizerDesc = authorizer.getName() + " (" + authorizer.getRole() + ")";
        AuditLog log = new AuditLog(
                "aud-" + System.currentTimeMillis(),
                cashierId != null ? cashierId : "unknown",
                cashierName != null ? cashierName : "Cashier",
                "CASHIER",
                action != null ? action : "FACE_ID_OVERRIDE",
                (details != null ? details : "Manager override") + " [Authorized via Biometric Face Scan]",
                authorizerDesc + " [Face ID Biometrics]",
                amount
        );
        auditLogs.add(0, log);

        result.put("authorized", true);
        result.put("managerName", authorizer.getName());
        result.put("managerRole", authorizer.getRole());
        result.put("timestamp", LocalDateTime.now().toString());
        result.put("message", "Action successfully authorized via Face ID Biometrics by " + authorizerDesc);
        result.put("auditId", log.getId());
        return result;
    }

    public Map<String, Object> verifyManagerOverride(String managerPin, String action, String details, String cashierId, String cashierName, double amount) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> managerOpt = users.stream()
                .filter(u -> u.getPinCode() != null && u.getPinCode().equals(managerPin.trim()))
                .findFirst();

        if (managerOpt.isEmpty()) {
            result.put("authorized", false);
            result.put("message", "Invalid Manager PIN. Access Denied.");
            return result;
        }

        User authorizer = managerOpt.get();
        if (!"MANAGER".equalsIgnoreCase(authorizer.getRole()) && !"ADMIN".equalsIgnoreCase(authorizer.getRole()) && !"SECURITY".equalsIgnoreCase(authorizer.getRole())) {
            result.put("authorized", false);
            result.put("message", "Unauthorized Role: " + authorizer.getRole() + ". Only Managers, Admins, and Security Officers can authorize overrides.");
            return result;
        }

        if (!"ACTIVE".equalsIgnoreCase(authorizer.getStatus())) {
            result.put("authorized", false);
            result.put("message", "User account is suspended or inactive.");
            return result;
        }

        // Authorization approved - record in audit trail
        String authorizerDesc = authorizer.getName() + " (" + authorizer.getRole() + ")";
        AuditLog log = new AuditLog(
                "aud-" + System.currentTimeMillis(),
                cashierId != null ? cashierId : "unknown",
                cashierName != null ? cashierName : "Cashier",
                "CASHIER",
                action != null ? action : "MANAGER_OVERRIDE",
                details != null ? details : "Manager override approved",
                authorizerDesc,
                amount
        );
        auditLogs.add(0, log);

        result.put("authorized", true);
        result.put("managerName", authorizer.getName());
        result.put("managerRole", authorizer.getRole());
        result.put("timestamp", LocalDateTime.now().toString());
        result.put("message", "Action successfully authorized by " + authorizerDesc);
        result.put("auditId", log.getId());
        return result;
    }

    public List<User> getAllUsers() {
        return users;
    }

    public Optional<User> getUserById(String id) {
        if (id == null) return Optional.empty();
        return users.stream().filter(u -> u.getId().equalsIgnoreCase(id.trim())).findFirst();
    }

    public User createUser(User user) {
        if (user.getId() == null || user.getId().isBlank()) {
            user.setId("usr-" + System.currentTimeMillis());
        }
        if (user.getStatus() == null || user.getStatus().isBlank()) {
            user.setStatus("ACTIVE");
        }
        String pin = user.getPinCode() != null && !user.getPinCode().isBlank() ? user.getPinCode() : user.getPin();
        if (pin != null) {
            user.setPinCode(pin);
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword("password123");
        }
        if (user.getAvatar() == null) {
            user.setAvatar("");
        }
        // Enforce: Face ID can ONLY be enrolled for accounts that are already created
        user.setFaceEnrolled(false);
        user.setFacePhoto(null);
        user.setFaceHash(null);
        user.setFaceBiometrics(null);
        if (user.getPermissions() == null || user.getPermissions().isEmpty()) {
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                user.setPermissions(new ArrayList<>(List.of("canAccessPos", "canAccessKds", "canAccessDashboard", "canAccessInventory", "canAccessOrders", "canAccessReports", "canPerformOverrides", "canSeeExpectedCash", "canManageStaff", "canEditInventory", "canEditMenu", "canScanFace")));
            } else if ("MANAGER".equalsIgnoreCase(user.getRole())) {
                user.setPermissions(new ArrayList<>(List.of("canAccessPos", "canAccessKds", "canAccessDashboard", "canAccessInventory", "canAccessOrders", "canAccessReports", "canPerformOverrides", "canSeeExpectedCash", "canManageStaff", "canScanFace")));
            } else if ("SECURITY".equalsIgnoreCase(user.getRole())) {
                user.setPermissions(new ArrayList<>(List.of("canAccessPos", "canAccessDashboard", "canAccessOrders", "canAccessReports", "canPerformOverrides", "canSeeExpectedCash", "canManageStaff", "canScanFace")));
            } else if ("BARISTA".equalsIgnoreCase(user.getRole())) {
                user.setPermissions(new ArrayList<>(List.of("canAccessKds", "canAccessOrders", "canScanFace")));
            } else {
                user.setPermissions(new ArrayList<>(List.of("canAccessPos", "canAccessOrders", "canScanFace")));
            }
        }
        users.add(user);
        return user;
    }

    public Optional<User> updateUser(String id, User updated) {
        for (int i = 0; i < users.size(); i++) {
            User existing = users.get(i);
            if (existing.getId().equalsIgnoreCase(id.trim())) {
                if (updated.getName() != null && !updated.getName().isBlank()) existing.setName(updated.getName().trim());
                if (updated.getEmail() != null && !updated.getEmail().isBlank()) existing.setEmail(updated.getEmail().trim());
                if (updated.getPassword() != null && !updated.getPassword().isBlank()) existing.setPassword(updated.getPassword());
                String newPin = updated.getPinCode() != null && !updated.getPinCode().isBlank() ? updated.getPinCode() : updated.getPin();
                if (newPin != null && !newPin.isBlank()) existing.setPinCode(newPin.trim());
                if (updated.getRole() != null && !updated.getRole().isBlank()) existing.setRole(updated.getRole().trim());
                if (updated.getHourlyRate() > 0) existing.setHourlyRate(updated.getHourlyRate());
                if (updated.getStatus() != null && !updated.getStatus().isBlank()) existing.setStatus(updated.getStatus().trim());
                if (updated.getPhone() != null) existing.setPhone(updated.getPhone().trim());
                if (updated.getAvatar() != null) {
                    existing.setAvatar(updated.getAvatar().trim());
                }
                if (updated.getFaceEnrolled() != null) existing.setFaceEnrolled(updated.getFaceEnrolled());
                if (updated.getFacePhoto() != null) {
                    existing.setFacePhoto(updated.getFacePhoto().trim());
                }
                if (updated.getPermissions() != null) existing.setPermissions(new ArrayList<>(updated.getPermissions()));
                recordAudit("STAFF_UPDATED", "Updated profile & security settings for " + existing.getName(), "ADMIN");
                return Optional.of(existing);
            }
        }
        return Optional.empty();
    }

    public boolean deleteUser(String id) {
        if (id == null) return false;
        Optional<User> target = getUserById(id);
        boolean removed = users.removeIf(u -> u.getId().equalsIgnoreCase(id.trim()));
        if (removed && target.isPresent()) {
            recordAudit("STAFF_DELETED", "Removed staff account: " + target.get().getName() + " (" + target.get().getRole() + ")", "ADMIN");
        }
        return removed;
    }

    public List<AuditLog> getAuditLogs() {
        return auditLogs;
    }

    public void logAudit(AuditLog log) {
        if (log.getId() == null) log.setId("aud-" + System.currentTimeMillis());
        auditLogs.add(0, log);
        while (auditLogs.size() > 500) {
            auditLogs.remove(auditLogs.size() - 1);
        }
    }

    public void recordAudit(String action, String details, String performedBy) {
        recordAudit(action, details, performedBy, null, null, null);
    }

    public void recordAudit(String action, String details, String performedBy, String ipAddress, String deviceInfo, String loginMethod) {
        AuditLog log = new AuditLog(
                "aud-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000),
                "sys",
                performedBy != null ? performedBy : "System",
                "SECURITY",
                action,
                details,
                performedBy != null ? performedBy : "System",
                0.0,
                ipAddress,
                deviceInfo,
                loginMethod
        );
        logAudit(log);
    }
}
