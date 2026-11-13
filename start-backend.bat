@echo off
title AromaPOS Spring Boot Backend (Port 8080)
color 0B

echo ===============================================================================
echo                AROMA COFFEE - SPRING BOOT BACKEND (PORT 8080)
echo ===============================================================================
echo.

where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java JDK is not found in PATH!
    echo Please install Java 17+ JDK.
    pause
    exit /b 1
)

cd /d "%~dp0demo"
echo Starting Maven Spring Boot Application...
mvnw.cmd spring-boot:run
pause
