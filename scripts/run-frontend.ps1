# Starts the React frontend dev server (Vite, port 5173) for VS Code.
$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $project "frontend"

Push-Location $frontend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies (first run, may take a few minutes)..." -ForegroundColor Cyan
        & npm install --legacy-peer-deps
    }
    Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Cyan
    & npm run dev
} finally {
    Pop-Location
}
