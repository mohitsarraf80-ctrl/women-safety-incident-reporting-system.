# Runs the full backend test suite (unit + integration, isolated H2 database).
# Uses the portable Maven/JDK when present, otherwise the PATH versions.
$ErrorActionPreference = "Stop"

$project   = Split-Path -Parent $PSScriptRoot
$workspace = Split-Path -Parent $project
$tools     = Join-Path $workspace "tools"

function Test-JavaHome([string]$Path) {
    return $Path -and (Test-Path (Join-Path $Path "bin\java.exe"))
}

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
    Write-Host "No working JDK found. Install JDK 17+ and set JAVA_HOME." -ForegroundColor Red
    exit 1
}

$portableMaven = Join-Path $tools "apache-maven-3.9.9\bin\mvn.cmd"
$maven = if (Test-Path $portableMaven) { $portableMaven } else { "mvn" }

Push-Location (Join-Path $project "backend")
try {
    & $maven test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tests failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "All backend tests passed. Reports: backend\target\surefire-reports" -ForegroundColor Green
} finally {
    Pop-Location
}
