# Starts the complete demo at login and opens the browser.
# MySQL is started first and waited for, then the backend and frontend windows open.
# Used by the Startup shortcut; can also be run manually.
$ErrorActionPreference = "Continue"

$scripts = $PSScriptRoot

Write-Host "Starting Women Safety demo..."

# 1. MySQL (this waits until port 3307 is ready)
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts "start-mysql.ps1")

# 2. Backend in its own window (kept open so the Java process stays alive)
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $scripts "run-backend.ps1")
) -WindowStyle Minimized

# 3. Frontend in its own window
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $scripts "run-frontend.ps1")
) -WindowStyle Minimized

# 4. Give the backend time to boot, then open the app
Start-Sleep -Seconds 65
Start-Process "http://localhost:5173"
