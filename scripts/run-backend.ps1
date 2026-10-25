# Starts the Spring Boot backend for local development (VS Code task friendly).
# Uses the portable Maven/JDK when present, otherwise the PATH versions.
$ErrorActionPreference = "Stop"

function Test-Port([int]$Port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(600)) { $client.Close(); return $false }
        $client.EndConnect($async)
        $client.Close()
        return $true
    } catch { return $false }
}

$project   = Split-Path -Parent $PSScriptRoot
$workspace = Split-Path -Parent $project
$tools     = Join-Path $workspace "tools"

if (Test-Port 8080) {
    Write-Host "Port 8080 is already in use - the backend is probably already running." -ForegroundColor Yellow
    Write-Host "If the public demo link is active, close it first (or use the link instead of running another backend)."
    exit 1
}

function Test-JavaHome([string]$Path) {
    return $Path -and (Test-Path (Join-Path $Path "bin\java.exe"))
}

# An inherited JAVA_HOME can be stale or point at a broken archive path, so validate it.
if (-not (Test-JavaHome $env:JAVA_HOME)) {
    $candidates = @()
    $candidates += Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk-*" }
    $candidates += Get-ChildItem "C:\Program Files\Java" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk-*" }
    $candidates += Get-ChildItem "C:\Program Files\java" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk-*" }

    $jdk = $candidates |
        Where-Object { Test-Path (Join-Path $_.FullName "bin\java.exe") } |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
}

if (-not (Test-JavaHome $env:JAVA_HOME)) {
    Write-Host "No working JDK found. Install JDK 17+ and set JAVA_HOME, then run this task again." -ForegroundColor Red
    exit 1
}

$portableMaven = Join-Path $tools "apache-maven-3.9.9\bin\mvn.cmd"
$maven = if (Test-Path $portableMaven) { $portableMaven } else { "mvn" }

Write-Host "JAVA_HOME = $env:JAVA_HOME" -ForegroundColor DarkGray
Write-Host "Maven     = $maven" -ForegroundColor DarkGray
Write-Host "Starting backend on http://localhost:8080 (dev profile, demo data seeded)..." -ForegroundColor Cyan

Push-Location (Join-Path $project "backend")
try {
    & $maven spring-boot:run "-Dspring-boot.run.profiles=dev"
} finally {
    Pop-Location
}
