@echo off
title AromaPOS Full-Stack System Launcher
color 0E

echo ===============================================================================
echo                AROMA COFFEE ROASTERY - FULL STACK SYSTEM
echo                 Spring Boot Backend (8080) + Next.js (3000)
echo ===============================================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check Java
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK is not found in PATH!
    echo Please install Java 17+ JDK.
    pause
    exit /b 1
)

echo [1/3] Launching Spring Boot Java Backend on port 8080...
start "AromaPOS Backend (Port 8080)" cmd /k "cd /d %~dp0demo && mvnw.cmd spring-boot:run"

echo [2/3] Waiting for backend initialization...
timeout /t 5 /nobreak >nul

echo [3/3] Launching Next.js E-Commerce Frontend on port 3000...
start "AromaPOS Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===============================================================================
echo                     SERVICES ARE RUNNING LOCALLY!
echo ===============================================================================
echo  - Public E-Commerce Storefront:   http://localhost:3000
echo  - Staff POS Register Login:       http://localhost:3000/login
echo  - Spring Boot REST API:           http://localhost:8080/api
echo  - Bakong KHQR Gateway:            Configured with official NBC SDK
echo ===============================================================================
echo.
echo Opening browser to http://localhost:3000 in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo Done! Press any key or close this window to keep servers running in background.
pause

