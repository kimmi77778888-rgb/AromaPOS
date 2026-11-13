@echo off
title AromaPOS Next.js Frontend (Port 3000)
color 0A

echo ===============================================================================
echo                AROMA COFFEE - NEXT.JS FRONTEND (PORT 3000)
echo ===============================================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

cd /d "%~dp0frontend"
echo Starting Next.js Development Server...
npm run dev
pause

