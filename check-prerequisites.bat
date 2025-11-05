@echo off
echo Checking for required tools for Google Cloud deployment...

echo.
echo 1. Checking for Google Cloud SDK...
where gcloud >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Google Cloud SDK is installed
    for /f "tokens=*" %%i in ('gcloud --version ^| findstr "Google Cloud SDK"') do set GCLOUD_VERSION=%%i
    echo Version: %GCLOUD_VERSION%
) else (
    echo [ERROR] Google Cloud SDK is not installed
    echo Please install it from: https://cloud.google.com/sdk/docs/install
)

echo.
echo 2. Checking for OpenSSL...
where openssl >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] OpenSSL is installed
    for /f "tokens=*" %%i in ('openssl version') do set OPENSSL_VERSION=%%i
    echo Version: %OPENSSL_VERSION%
) else (
    echo [ERROR] OpenSSL is not installed
    echo Please install it from: https://slproweb.com/products/Win32OpenSSL.html
    echo Or use Chocolatey: choco install openssl
)

echo.
echo Summary:
where gcloud >nul 2>&1
if %errorlevel% equ 0 (
    set GCLOUD_INSTALLED=1
) else (
    set GCLOUD_INSTALLED=0
)

where openssl >nul 2>&1
if %errorlevel% equ 0 (
    set OPENSSL_INSTALLED=1
) else (
    set OPENSSL_INSTALLED=0
)

if %GCLOUD_INSTALLED% equ 1 if %OPENSSL_INSTALLED% equ 1 (
    echo [ALL PREREQUISITES INSTALLED] You can now run the deployment script
) else (
    echo [MISSING PREREQUISITES] Please install the missing tools before running the deployment script
)

echo.
pause