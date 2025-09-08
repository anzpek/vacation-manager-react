@echo off
echo Quick Start - Vacation Management System
echo.

rem Force clean install if needed
if "%1"=="--clean" (
    echo Cleaning dependencies...
    rmdir /s /q node_modules 2>nul
    del package-lock.json 2>nul
    npm install --legacy-peer-deps
)

rem Simple start
echo Starting server...
npm start

pause