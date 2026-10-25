# Starts the React frontend with the Vite dev server (http://localhost:5173).
# Usage:   .\scripts\start-frontend.ps1
param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

Push-Location $frontend
try {
    if ($Install -or -not (Test-Path (Join-Path $frontend "node_modules"))) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
        & npm install
    }
    Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Cyan
    & npm run dev
} finally {
    Pop-Location
}
