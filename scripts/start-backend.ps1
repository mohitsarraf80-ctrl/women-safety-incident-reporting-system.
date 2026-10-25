# Compatibility wrapper.
# The real launcher is run-backend.ps1, which uses the portable Maven and a working JDK.
# The old version called "mvn" directly and failed with:
#   The term 'mvn' is not recognized ...
#
# Usage:   .\scripts\start-backend.ps1

Write-Host "start-backend.ps1 is deprecated - using run-backend.ps1" -ForegroundColor DarkGray
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "run-backend.ps1")
exit $LASTEXITCODE
