@echo off
color 0A
title Vacation Management System - Development Server

echo ========================================
echo  Vacation Management System Dev Server
echo ========================================
echo.

rem Check Node.js version
echo [INFO] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
echo.

rem Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found! Please run this from the project root.
    pause
    exit /b 1
)

rem Install dependencies if needed or if they're corrupted
if not exist "node_modules" (
    echo [INFO] Dependencies not found. Installing...
    echo [INFO] This may take several minutes...
    npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully!
    echo.
) else (
    rem Check if react-scripts exists
    if not exist "node_modules\.bin\react-scripts.cmd" (
        echo [WARNING] Dependencies appear corrupted. Reinstalling...
        rmdir /s /q node_modules
        del package-lock.json 2>nul
        npm install --legacy-peer-deps
        if %errorlevel% neq 0 (
            echo [ERROR] Failed to reinstall dependencies!
            pause
            exit /b 1
        )
        echo [SUCCESS] Dependencies reinstalled successfully!
        echo.
    )
)

rem Check if port 3000 is available
echo [INFO] Checking if port 3000 is available...
netstat -an | find ":3000 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use!
    echo [INFO] The server might already be running, or another application is using port 3000.
    echo [INFO] Please check http://localhost:3000 in your browser.
    pause
)

rem Start development server
echo [INFO] Starting development server...
echo [INFO] Server will be available at: http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server.
echo ========================================
echo.

rem Set environment variable for better error reporting
set GENERATE_SOURCEMAP=false
set BROWSER=none

rem Start the server
npm start
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start development server!
    echo [INFO] Trying alternative start method...
    npx react-scripts start
    if %errorlevel% neq 0 (
        echo [ERROR] All start methods failed!
        echo [INFO] Please check the error messages above.
        pause
        exit /b 1
    )
)

pause