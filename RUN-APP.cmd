@echo off
title Women Safety - Launcher
echo ================================================
echo   Women Safety Incident Reporting Platform
echo ================================================
echo.
echo Starting MySQL, backend and frontend in separate windows...
echo Keep those three windows open while you use the app.
echo.

start "Women Safety - MySQL" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0scripts\start-mysql.ps1"
start "Women Safety - Backend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0scripts\run-backend.ps1"
start "Women Safety - Frontend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0scripts\run-frontend.ps1"

echo Waiting for the services to start (about 60 seconds)...
timeout /t 55 /nobreak >nul

start "" http://localhost:5173
echo.
echo Browser opened at http://localhost:5173
echo Login: admin@demo.local / Demo@12345
echo.
pause
