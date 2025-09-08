@echo off
color 0C
title Troubleshooting - Vacation Management System

echo ==========================================
echo   TROUBLESHOOTING GUIDE
echo ==========================================
echo.

echo [STEP 1] Check Node.js installation
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

echo [STEP 2] Check npm installation  
npm --version
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)
echo [OK] npm is installed
echo.

echo [STEP 3] Check project files
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Please run this from the project root directory
    pause
    exit /b 1
)
echo [OK] package.json found
echo.

echo [STEP 4] Check dependencies
if not exist "node_modules" (
    echo [WARNING] node_modules not found
    echo Run: npm install --legacy-peer-deps
) else (
    if not exist "node_modules\.bin\react-scripts.cmd" (
        echo [WARNING] react-scripts not found in node_modules
        echo Dependencies may be corrupted
        echo Run: npm install --legacy-peer-deps --force
    ) else (
        echo [OK] Dependencies appear to be installed
    )
)
echo.

echo [STEP 5] Check port 3000
netstat -an | find ":3000 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use!
    echo Another application may be running on port 3000
    echo Try: http://localhost:3000 in your browser
) else (
    echo [OK] Port 3000 is available
)
echo.

echo ==========================================
echo   QUICK FIXES
echo ==========================================
echo.
echo 1. Clean install:
echo    rmdir /s /q node_modules
echo    del package-lock.json
echo    npm install --legacy-peer-deps
echo.
echo 2. Alternative start:
echo    npx react-scripts start
echo.
echo 3. Check if server is already running:
echo    http://localhost:3000
echo.
echo 4. Kill processes on port 3000:
echo    netstat -ano | findstr :3000
echo    taskkill /PID [process_id] /F
echo.

pause