# AromaPOS — Next.js Enterprise Frontend

Artisan Coffee Shop Point of Sale (POS) and Inventory Management System built with **Next.js (App Router)**, **React 19**, **Tailwind CSS**, and seamless integration with the **Spring Boot** backend.

---

## 🚀 Quick Start

### 1. Start Spring Boot Backend
Ensure your Spring Boot backend is running on `http://localhost:8080`:
```bash
cd demo
./mvnw spring-boot:run
```

### 2. Start Next.js Frontend Dev Server
Run the Next.js development server with Turbopack on port 3000:
```bash
cd frontend
npm run dev
```

Open your browser:
- **Main POS Terminal / Admin Suite**: [http://localhost:3000](http://localhost:3000)
- **Customer Dual-Screen Display**: [http://localhost:3000/customer](http://localhost:3000/customer)

---

## 🛠 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.jsx            # Root layout with Khmer fonts, providers, metadata
│   │   ├── page.jsx              # Main POS Terminal & Management Suite route
│   │   ├── customer/
│   │   │   └── page.jsx          # Dedicated Dual-Screen Customer Display route
│   │   └── globals.css           # Tailwind CSS & Khmer typography styling
│   ├── components/               # UI & POS feature components
│   │   ├── auth/                 # Login, Staff Management, Quick Lock, Overrides
│   │   ├── pos/                  # POS Terminal, Cart, Checkout, Customer Display
│   │   ├── inventory/            # Inventory & Stock Management
│   │   ├── dashboard/            # Analytics, Shift Management, Z-Reports
│   │   ├── orders/               # Kitchen Display (KDS) & Order History
│   │   └── common/               # Modals, Logo, Language Switcher, Sound effects
│   ├── context/                  # Global React Contexts (AppContext, LanguageContext)
│   ├── services/                 # Backend API services (api.js, sound.js)
│   └── utils/                    # Utility helpers (storage.js - SSR-safe localStorage)
├── next.config.mjs               # Next.js configuration with Spring Boot proxy rewrites
├── postcss.config.mjs            # PostCSS configuration for Tailwind CSS
├── jsconfig.json                 # Path aliases (@/* -> ./src/*)
└── package.json                  # Dependencies & scripts
```

---

## 🔄 API Reverse Proxy Configuration

Next.js is configured in `next.config.mjs` to seamlessly forward API calls to the Spring Boot backend:
- `/api/*` $\rightarrow$ `http://localhost:8080/api/*`
- `/uploads/*` $\rightarrow$ `http://localhost:8080/uploads/*`

This eliminates CORS issues during development and production while maintaining high-performance SSR and Turbopack fast refresh.

---

## 📦 Production Build

To create an optimized production build:
```bash
npm run build
npm run start
```
