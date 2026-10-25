# Starts the portable MySQL 8 instance used by this demo (port 3307).
# Safe to run when MySQL is already running: it only reports and exits.
$ErrorActionPreference = "Continue"

function Test-Port([int]$Port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(700)) { $client.Close(); return $false }
        $client.EndConnect($async)
        $client.Close()
        return $true
    } catch { return $false }
}

$project   = Split-Path -Parent $PSScriptRoot
$workspace = Split-Path -Parent $project
$mysql     = Join-Path $workspace "tools\mysql-8.0.43-winx64"
$data      = Join-Path $workspace "tools\mysql-data"

if (Test-Port 3307) {
    Write-Host "MySQL is already running on port 3307." -ForegroundColor Green
    exit 0
}

if (-not (Test-Path (Join-Path $mysql "bin\mysqld.exe"))) {
    Write-Host "Portable MySQL was not found at $mysql" -ForegroundColor Yellow
    Write-Host "Install MySQL 8 and set DB_URL/DB_USERNAME/DB_PASSWORD in backend\.env,"
    Write-Host "or use: docker compose up -d (then set DB_URL to port 3306)."
    exit 1
}

Write-Host "Starting MySQL on port 3307 ..." -ForegroundColor Cyan
# MySQL/InnoDB needs a writable temp directory. The user's %TEMP% can be blocked
# (errno 13), so use a folder inside the workspace instead.
$tmp = Join-Path $workspace "tools\mysql-tmp"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$arguments = "--no-defaults --basedir=`"$mysql`" --datadir=`"$data`" --tmpdir=`"$tmp`" " +
             "--port=3307 --bind-address=127.0.0.1 --mysqlx=0 --console"
Start-Process -FilePath (Join-Path $mysql "bin\mysqld.exe") -ArgumentList $arguments -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $workspace "tools\mysql-vscode.out.log") `
    -RedirectStandardError (Join-Path $workspace "tools\mysql-vscode.err.log") | Out-Null

for ($i = 0; $i -lt 30; $i++) {
    if (Test-Port 3307) { Write-Host "MySQL is ready on 3307." -ForegroundColor Green; exit 0 }
    Start-Sleep -Seconds 1
}
Write-Host "MySQL did not open port 3307. Check tools\mysql-vscode.err.log." -ForegroundColor Red
exit 1
