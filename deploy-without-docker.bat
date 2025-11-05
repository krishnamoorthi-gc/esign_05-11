@echo off
REM OpenSign Deployment Script - Without Docker (Windows Version)
REM This script automates the deployment of OpenSign on Windows without Docker

TITLE OpenSign Deployment (No Docker)

ECHO ========================================
ECHO   OpenSign Deployment Script (No Docker) 
ECHO ========================================

ECHO Checking for administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    ECHO Running with administrator privileges
) else (
    ECHO Please run this script as Administrator
    PAUSE
    EXIT /B
)

ECHO Installing Chocolatey (package manager) if not already installed...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

ECHO Installing Node.js v18...
choco install nodejs --version 18.17.0 -y

ECHO Installing MongoDB...
choco install mongodb -y

ECHO Installing LibreOffice...
choco install libreoffice -y

ECHO Refreshing environment variables...
call refreshenv

ECHO Installing PM2 globally...
npm install -g pm2

ECHO Creating application directory...
mkdir "C:\opensign"
cd "C:\opensign"

ECHO.
ECHO Please copy your OpenSign files to C:\opensign before continuing
ECHO The directory structure should be:
ECHO C:\opensign\backend\OpenSignServer
ECHO C:\opensign\frontend\OpenSign
ECHO.
PAUSE

ECHO Installing backend dependencies...
cd "C:\opensign\backend\OpenSignServer"
npm install

ECHO Installing frontend dependencies...
cd "C:\opensign\frontend\OpenSign"
npm install

ECHO Building frontend for production...
npm run build

ECHO Generating secure master key...
for /f %%i in ('powershell -Command "$key = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid)); Write-Host $key"') do set MASTER_KEY=%%i

ECHO Creating environment files...

ECHO APP_ID=opensign>"C:\opensign\backend\OpenSignServer\.env"
ECHO MASTER_KEY=%MASTER_KEY%>>"C:\opensign\backend\OpenSignServer\.env"
ECHO MONGODB_URI=mongodb://localhost:27017/OpenSignDB>>"C:\opensign\backend\OpenSignServer\.env"
ECHO SERVER_URL=http://localhost:8081/app>>"C:\opensign\backend\OpenSignServer\.env"
ECHO USE_LOCAL=true>>"C:\opensign\backend\OpenSignServer\.env"
ECHO PORT=8081>>"C:\opensign\backend\OpenSignServer\.env"

ECHO PUBLIC_URL=>"C:\opensign\frontend\OpenSign\.env"
ECHO GENERATE_SOURCEMAP=false>>"C:\opensign\frontend\OpenSign\.env"
ECHO REACT_APP_SERVERURL=http://localhost:8081/app>>"C:\opensign\frontend\OpenSign\.env"
ECHO REACT_APP_APPID=opensign>>"C:\opensign\frontend\OpenSign\.env"

ECHO Creating PM2 configuration...
(
ECHO {
ECHO   "apps": [
ECHO     {
ECHO       "name": "opensign-backend",
ECHO       "script": "npm",
ECHO       "args": "run dev",
ECHO       "cwd": "C:/opensign/backend/OpenSignServer",
ECHO       "env": {
ECHO         "NODE_ENV": "production"
ECHO       }
ECHO     },
ECHO     {
ECHO       "name": "opensign-frontend",
ECHO       "script": "npm",
ECHO       "args": "run start",
ECHO       "cwd": "C:/opensign/frontend/OpenSign",
ECHO       "env": {
ECHO         "NODE_ENV": "production"
ECHO       }
ECHO     }
ECHO   ]
ECHO }
) > "C:\opensign\ecosystem.config.js"

ECHO Starting MongoDB service...
net start MongoDB

ECHO Starting applications with PM2...
cd "C:\opensign"
pm2 start ecosystem.config.js

ECHO Saving PM2 configuration...
pm2 save

ECHO.
ECHO ========================================
ECHO   Deployment completed successfully!     
ECHO ========================================
ECHO.
ECHO Next steps:
ECHO 1. Update the .env files in C:\opensign\backend\OpenSignServer and C:\opensign\frontend\OpenSign with your specific configuration
ECHO 2. For public access, configure Windows Firewall to allow traffic on ports 80 and 443
ECHO 3. Consider using IIS as a reverse proxy for production deployments
ECHO.
ECHO Application will be accessible at:
ECHO   Frontend: http://localhost:3000
ECHO   Backend API: http://localhost:8081/app
ECHO.
ECHO PM2 commands:
ECHO   pm2 status     - View application status
ECHO   pm2 logs       - View application logs
ECHO   pm2 restart    - Restart applications
ECHO.
PAUSE