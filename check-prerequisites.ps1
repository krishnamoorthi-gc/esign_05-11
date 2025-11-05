Write-Host "Checking for required tools for Google Cloud deployment..." -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Checking for Google Cloud SDK..." -ForegroundColor Cyan
$gcloudPath = Get-Command "gcloud" -ErrorAction SilentlyContinue
if ($gcloudPath) {
    Write-Host "[SUCCESS] Google Cloud SDK is installed" -ForegroundColor Green
    $gcloudVersion = & gcloud --version 2>$null | Select-String "Google Cloud SDK"
    if ($gcloudVersion) {
        Write-Host "Version: $gcloudVersion" -ForegroundColor Gray
    }
} else {
    Write-Host "[ERROR] Google Cloud SDK is not installed" -ForegroundColor Red
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2. Checking for OpenSSL..." -ForegroundColor Cyan
$opensslPath = Get-Command "openssl" -ErrorAction SilentlyContinue
if ($opensslPath) {
    Write-Host "[SUCCESS] OpenSSL is installed" -ForegroundColor Green
    try {
        $opensslVersion = & openssl version 2>$null
        if ($opensslVersion) {
            Write-Host "Version: $opensslVersion" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Version: Unable to determine OpenSSL version" -ForegroundColor Gray
    }
} else {
    Write-Host "[ERROR] OpenSSL is not installed" -ForegroundColor Red
    Write-Host "Please install it from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Gray
    Write-Host "Or use Chocolatey: choco install openssl" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
$gcloudInstalled = $null -ne $gcloudPath
$opensslInstalled = $null -ne $opensslPath

if ($gcloudInstalled -and $opensslInstalled) {
    Write-Host "[ALL PREREQUISITES INSTALLED] You can now run the deployment script" -ForegroundColor Green
} else {
    Write-Host "[MISSING PREREQUISITES] Please install the missing tools before running the deployment script" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")