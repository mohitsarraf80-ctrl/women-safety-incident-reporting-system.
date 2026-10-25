# Starts a temporary public HTTPS URL for the app using a Cloudflare quick tunnel.
# Use this when the phone is NOT on the same Wi-Fi (for example mobile data).
#
# Prerequisite (one time):
#   winget install --id Cloudflare.cloudflared
#   (or download cloudflared from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
#
# Usage:   .\scripts\start-tunnel.ps1
#          .\scripts\start-tunnel.ps1 -Port 5173
#
# The printed https://<random>.trycloudflare.com link is PUBLIC while this window is open.
# It changes every time you restart the tunnel. Stop it with Ctrl+C.

param([int]$Port = 5173)

$ErrorActionPreference = "Stop"

$command = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $command) {
    Write-Host "cloudflared was not found on PATH." -ForegroundColor Yellow
    Write-Host "Install it once with:  winget install --id Cloudflare.cloudflared"
    Write-Host "Then reopen the terminal and run this script again."
    exit 1
}

$health = $null
try {
    $health = Invoke-RestMethod -Uri "http://localhost:$Port" -TimeoutSec 5
} catch {
    Write-Host "The app does not answer on http://localhost:$Port - start the frontend first." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting a public tunnel to http://localhost:$Port ..." -ForegroundColor Cyan
Write-Host "Look for the https://....trycloudflare.com line below, then open it on the phone." -ForegroundColor Gray
Write-Host "Anyone with this link can reach the demo while it runs - stop with Ctrl+C." -ForegroundColor Yellow
Write-Host ""

& $command.Source tunnel --url "http://localhost:$Port" --no-autoupdate
