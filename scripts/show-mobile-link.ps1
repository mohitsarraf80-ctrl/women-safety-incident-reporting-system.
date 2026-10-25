# Prints the address a phone on the same Wi-Fi can use to open the app.
# Usage:   .\scripts\show-mobile-link.ps1
param([int]$Port = 5173)

$ErrorActionPreference = "SilentlyContinue"

$ip = $null
try {
    $config = Get-NetIPConfiguration |
        Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" } |
        Select-Object -First 1
    $ip = $config.IPv4Address.IPAddress
} catch {
    # Older Windows / restricted shells fall through to the ipconfig parser below.
    $ip = $null
}

if (-not $ip) {
    # Fallback: read every IPv4 address printed by ipconfig and skip loopback/APIPA.
    foreach ($line in (ipconfig)) {
        if ($line -match "IPv4" -and $line -match "(\d{1,3}(?:\.\d{1,3}){3})") {
            $candidate = $Matches[1]
            if ($candidate -notmatch "^(127\.|169\.254\.)") {
                $ip = $candidate
                break
            }
        }
    }
}

if (-not $ip) {
    Write-Host "Could not detect a LAN IPv4 address. Run 'ipconfig' and look for the Wi-Fi adapter." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "  Phone link (same Wi-Fi):  http://${ip}:${Port}" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Requirements:"
Write-Host "   - phone and this computer are on the same Wi-Fi network"
Write-Host "   - backend running on port 8080 and 'npm run dev' running here"
Write-Host "   - Windows Firewall allows Node.js on private networks"
Write-Host ""
Write-Host "  If the phone cannot connect, allow Node.js through the firewall (admin PowerShell):"
Write-Host "   New-NetFirewallRule -DisplayName 'Vite dev 5173' -Direction Inbound -Protocol TCP -LocalPort ${Port} -Action Allow -Profile Private"
Write-Host ""
