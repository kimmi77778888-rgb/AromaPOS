# AromaPOS - System Setup & Architecture Guide
**Artisan Coffee E-Commerce & Hybrid Point-of-Sale System**

---

## 🚀 Quick Start (1-Click Local Launch)

For Windows users, launch both Backend and Frontend together with one click:

### Option A: 1-Click Batch Script
- **Double click:** `start-all.bat` in the project root folder.
  - Automatically verifies Java JDK and Node.js.
  - Starts the Spring Boot backend in a dedicated window on **Port 8080**.
  - Starts the Next.js frontend in a dedicated window on **Port 3000**.
  - Automatically opens `http://localhost:3000` in your default browser.

### Option B: Terminal / Command Line
```bash
# Start both backend and frontend concurrently
npm run dev

# Or start individually:
# Terminal 1 - Backend:
cd demo && .\mvnw.cmd spring-boot:run

# Terminal 2 - Frontend:
cd frontend && npm run dev
```

---

## 🌐 Application URL Directory

| Route / Service | Local Development URL | Render Production URL | Description |
|---|---|---|---|
| **Public E-Commerce Storefront** | `http://localhost:3000` | `https://aromapos-frontend.onrender.com` | Customer landing page, drink customizer, cart drawer, live Bakong KHQR checkout, and customer account |
| **POS & Staff Portal (Hidden)** | `http://localhost:3000/login` | `https://aromapos-frontend.onrender.com/login` | Direct URL access for baristas & managers (hidden from public storefront navigation as requested) |
| **Spring Boot REST API** | `http://localhost:8080/api` | `https://aromapos-backend.onrender.com/api` | Core backend API endpoints (products, orders, KHQR, staff, reports) |
| **Swagger API Docs** | `http://localhost:8080/swagger-ui/index.html` | `https://aromapos-backend.onrender.com/swagger-ui/index.html` | Interactive OpenAPI documentation |

---

## 🛠️ Resolved Inconsistencies (From Screenshots)

### 1. Authentic NBC Bakong KHQR vs Old Fake QR Code (Screenshot 1)
- **Previous Issue:** Displayed an un-scannable stylized SVG icon (`:o: / o:r.`) with a mock simulation button.
- **Current Implementation:**
  - Integrated the official National Bank of Cambodia `bakong-khqr` SDK (`IndividualInfo` + EMVCo TLV format + CRC16).
  - Generates real, crisp 380x380 Base64 PNG QR images scannable by any Cambodian mobile banking app (ABA Mobile, Wing, ACLEDA, Bakong).
  - Multi-step realistic processing pipeline:
    1. **Order Review & KHQR Presentation:** Countdown timer, USD/KHR exchange rates, and copyable KHQR string.
    2. **Dynamic Processing Pipeline:** Live animated status transitions (*"Connecting to NBC Bakong Gateway"* -> *"Validating KHQR transaction"* -> *"Dispatching to POS kitchen KDS"*).
    3. **Order Confirmation:** Confetti celebration, printable/downloadable official Tax Invoice receipt, and live GPS delivery tracking map.

### 2. Real User Profile Photo Upload vs Fake Stock Avatar (Screenshot 2)
- **Previous Issue:** Displayed a stock stock photo of a woman (`Member 444`) with no easy way to use personal photos.
- **Current Implementation:**
  - Removed all fake stock avatar URLs.
  - Added real photo uploading from user's device/camera with automated client-side HTML5 Canvas square cropping (360x360).
  - If no photo is uploaded, cleanly falls back to a gold VIP monogram badge with the customer's initial.
  - Profile modal includes a dedicated photo upload trigger with camera overlay.

---

## 📦 Production Deployment (Render)

The project is configured via `render.yaml` for zero-downtime deployment:
- **Backend Service:** `aromapos-backend` (Docker runtime, JDK 17, Port 8080)
- **Frontend Service:** `aromapos-frontend` (Node.js runtime, Next.js 16, Port 3000)
- Any commit pushed to the `main` branch automatically triggers a redeployment on Render.

---

*AromaPOS Team • Cambodia Artisan Coffee Roastery*
