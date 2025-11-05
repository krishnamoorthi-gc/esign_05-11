@echo off
setlocal enabledelayedexpansion

REM Deployment script for OpenSign to Google Cloud Platform without Docker and with external IP addresses (Windows version)

echo ===============================================
echo   OpenSign Deployment to GCP (No Docker + External IPs)
echo ===============================================

REM Check if required tools are installed
echo Checking for required tools...
where gcloud >nul 2>&1
if %errorlevel% neq 0 (
    echo Google Cloud SDK is not installed. Please install it first.
    echo Visit https://cloud.google.com/sdk/docs/install for installation instructions.
    pause
    exit /b 1
)

where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo OpenSSL is not installed. Please install it first.
    pause
    exit /b 1
)

REM Set your Google Cloud project ID
set /p PROJECT_ID="Enter your Google Cloud Project ID: "

REM Set your desired region and zone
set /p REGION="Enter your desired region (default: us-central1): "
if "!REGION!"=="" set REGION=us-central1
set ZONE=%REGION%-a

REM Generate secure master key
for /f %%i in ('openssl rand -base64 32') do set MASTER_KEY=%%i
echo Generated secure master key

REM Set Google Cloud project
echo Setting Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required services
echo Enabling required Google Cloud services...
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

REM Reserve static external IP addresses
echo Reserving static external IP addresses...
gcloud compute addresses create opensign-mongo-ip --region=%REGION%
gcloud compute addresses create opensign-backend-ip --region=%REGION%
gcloud compute addresses create opensign-frontend-ip --region=%REGION%

REM Get the reserved IP addresses
for /f %%i in ('gcloud compute addresses describe opensign-mongo-ip --region^=%REGION% --format^="value^(address^)"') do set MONGO_EXTERNAL_IP=%%i
for /f %%i in ('gcloud compute addresses describe opensign-backend-ip --region^=%REGION% --format^="value^(address^)"') do set BACKEND_EXTERNAL_IP=%%i
for /f %%i in ('gcloud compute addresses describe opensign-frontend-ip --region^=%REGION% --format^="value^(address^)"') do set FRONTEND_EXTERNAL_IP=%%i

echo Reserved IP addresses:
echo   MongoDB: %MONGO_EXTERNAL_IP%
echo   Backend: %BACKEND_EXTERNAL_IP%
echo   Frontend: %FRONTEND_EXTERNAL_IP%

REM Create firewall rules
echo Creating firewall rules...
gcloud compute firewall-rules create opensign-mongo-firewall ^
    --allow tcp:27017 ^
    --source-ranges=%BACKEND_EXTERNAL_IP%/32 ^
    --description="Allow MongoDB access from backend"

gcloud compute firewall-rules create opensign-backend-firewall ^
    --allow tcp:8081 ^
    --source-ranges=0.0.0.0/0 ^
    --description="Allow backend API access"

gcloud compute firewall-rules create opensign-frontend-firewall ^
    --allow tcp:80,tcp:443 ^
    --source-ranges=0.0.0.0/0 ^
    --description="Allow frontend access"

REM Create startup scripts for instances
echo Creating startup scripts...

REM Create MongoDB startup script
echo #!/bin/bash > mongo-startup.sh
echo set -e >> mongo-startup.sh
echo apt update ^&^& apt upgrade -y >> mongo-startup.sh
echo apt install -y wget gnupg >> mongo-startup.sh
echo wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc ^| sudo apt-key add - >> mongo-startup.sh
echo echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" ^| sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list >> mongo-startup.sh
echo apt update >> mongo-startup.sh
echo apt install -y mongodb-org >> mongo-startup.sh
echo systemctl start mongod >> mongo-startup.sh
echo systemctl enable mongod >> mongo-startup.sh
echo # Configure MongoDB to accept connections from external IPs >> mongo-startup.sh
echo sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf >> mongo-startup.sh
echo systemctl restart mongod >> mongo-startup.sh

REM Create backend startup script
echo #!/bin/bash > backend-startup.sh
echo set -e >> backend-startup.sh
echo apt update ^&^& apt upgrade -y >> backend-startup.sh
echo apt install -y curl wget gnupg software-properties-common >> backend-startup.sh
echo # Install Node.js ^(v18^) >> backend-startup.sh
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash - >> backend-startup.sh
echo apt-get install -y nodejs >> backend-startup.sh
echo # Install PM2 for process management >> backend-startup.sh
echo npm install -g pm2 >> backend-startup.sh
echo # Install LibreOffice >> backend-startup.sh
echo apt install -y libreoffice >> backend-startup.sh
echo # Create application directory >> backend-startup.sh
echo mkdir -p /opt/opensign >> backend-startup.sh
echo cd /opt/opensign >> backend-startup.sh
echo # Clone OpenSign backend ^(you may need to adjust this based on your repository^) >> backend-startup.sh
echo git clone https://github.com/OpenSignLabs/OpenSign.git . >> backend-startup.sh
echo cd backend/OpenSignServer >> backend-startup.sh
echo npm install >> backend-startup.sh
echo # Create environment file >> backend-startup.sh
echo cat ^> .env ^<^< EOF >> backend-startup.sh
echo # Production environment configuration for OpenSign >> backend-startup.sh
echo # Backend ExpressJS config >> backend-startup.sh
echo appName=open_sign_server >> backend-startup.sh
echo MASTER_KEY='"'%MASTER_KEY%'"' >> backend-startup.sh
echo MONGODB_URI=mongodb://'%MONGO_EXTERNAL_IP%':27017/OpenSignDB >> backend-startup.sh
echo SERVER_URL=http://'%BACKEND_EXTERNAL_IP%':8081/app >> backend-startup.sh
echo PARSE_MOUNT=/app >> backend-startup.sh
echo PORT=8081 >> backend-startup.sh
echo # Storage config >> backend-startup.sh
echo USE_LOCAL=true >> backend-startup.sh
echo # Email configuration >> backend-startup.sh
echo SMTP_ENABLE=true >> backend-startup.sh
echo SMTP_HOST=smtp.gmail.com >> backend-startup.sh
echo SMTP_PORT=587 >> backend-startup.sh
echo SMTP_USER_EMAIL=vatgcbs15@gmail.com >> backend-startup.sh
echo SMTP_PASS="eacb ytol wvvz nzcu" >> backend-startup.sh
echo SMTP_FROM_NAME=OpenSign >> backend-startup.sh
echo SMTP_REPLY_TO_EMAIL=vatgcbs15@gmail.com >> backend-startup.sh
echo # Document signing certificate >> backend-startup.sh
echo PFX_BASE64='MIIKCQIBAzCCCc8GCSqGSIb3DQEHAaCCCcAEggm8MIIJuDCCBG8GCSqGSIb3DQEH >> backend-startup.sh
echo BqCCBGAwggRcAgEAMIIEVQYJKoZIhvcNAQcBMBwGCiqGSIb3DQEMAQYwDgQIpumu >> backend-startup.sh
echo bFabBWACAggAgIIEKDqHS7Icd5MzIBk1dBokGK2s+5a2fA4308WA1QzEWmczqVYI >> backend-startup.sh
echo z6lYmW8qsiZIw4PFkRzdIx1+zCmP8jgWiiqh5RKnbHYmh1JPNyx9SqmUDILDXmjg >> backend-startup.sh
echo KxO9agRw9LXge4hgRL7YW0TxYZYw4EeXV9Yr7kcOq9DoO2MoRikJ+2Tuvvq/hfuV >> backend-startup.sh
echo 9zFHsz4jpf7W95k1IeH6bZ92klz5R1e/EK8JuHy592i/u+BxxW1vTkiPpTaHD6s9 >> backend-startup.sh
echo 1lDSkT1j0LIDU6l9gVvJvFBV8j88vet/Z4QkTbHPMYvBnKNRstKuOvDasEJE4RkA >> backend-startup.sh
echo PV4TfBwFF6uvREZI1vBboM/18pzeyjoRX+mlJNfcH3kh1tkck+Jg+M2bLXAH1EdD >> backend-startup.sh
echo GRwENvnTNW1CFIn37VVja7SFBQNXA+E6rejmqtUmZ5XktSINDBUyjow9XuYTUtI/ >> backend-startup.sh
echo sgcRSC0aB0EKKpphbFPp1niKCLm1ef33e+bWyWbtR2L2Kc3ETmhjNADpyapAGmzc >> backend-startup.sh
echo LP2BafGaKj18KiLAG4GL6+kXk0GUz7Fw5q8H8RY1T33o+xjWvC0+aJgvr65qWdKw >> backend-startup.sh
echo +ug6wuu4Cr2kFEuXxPKsnYqmE5NT/x+lfunlZ5iEQN3w2XO5J2u2eMXVRUsPH2T6 >> backend-startup.sh
echo 0sJKomjY0RB1JsqZBnyleWm+tYo0RpVAyJ3NGBp9dVb7a3Qw6jNZBG/xMW+gvtUJ >> backend-startup.sh
echo q6hfK/cD3cagD0NQFVD5STMOuGOSqq/bbwAKjZ/lrPmCCYATKwkjAFybYfHJVrrW >> backend-startup.sh
echo Y2tQgCQ/zrZLIxQjp7F17hU0+gT54x0MpF6AoqIM/qqNnHrQ0fi50ECmLvx3SqYa >> backend-startup.sh
echo nvjvt/HZhMZfqRXiXjeicIwpnNoG7+uQknySk+7cc9GNhHZR7cfPfkTpgvuuebrQ >> backend-startup.sh
echo l5YW+k9tG+xrX8g72nvtFMnammlBixlFwECJaEszEQk5tc2ti8uG2z+kGnFoDoBV >> backend-startup.sh
echo M6ZVMpKDJzXPxLdzT6ChIPyatjIkqOKe6vDpnmzcoEhbBhmtkVjWFA2dfX846ugV >> backend-startup.sh
echo y1QiecWgk8pMNWhh3IDd05v/wzbFwNcq+Gi+1dZsPmFH+egIcrQKZu2r3jCJtGHh >> backend-startup.sh
echo DNG/nyf/anqvKXF90bi4hRT3vdDXXuWgY7EUwfn9h5jYabCO6HsQxQOBjFYNmBrh >> backend-startup.sh
echo MfaiBZe72E8fzNAfIlwDcJ4AWY1SOM7hi8bqfRWw1NtNxuMUiRFoR31O6XkQauye >> backend-startup.sh
echo 9hAmpdlZHZXtJ6LM0QaWkPJmG3058GMtIn/qS60V9nINh+zXhwza/1pnFB+e9MWc >> backend-startup.sh
echo hAPgo0nn55FusM//g1nM31PKe+nOm3Jyp0nEQ4m8aDtJS63o2fvp3e2KJbPWQMHE >> backend-startup.sh
echo a83W975diWg4NTdevV9lFpNllHclVoPoavUHIzHd7HF9TcPpjbXJSUZ7cITHHefr >> backend-startup.sh
echo kQTa/2G9cWuRhN9GKIHBdr13nfEvMIIFQQYJKoZIhvcNAQcBoIIFMgSCBS4wggUq >> backend-startup.sh
echo MIIFJgYLKoZIhvcNAQwKAQKgggTuMIIE6jAcBgoqhkiG9w0BDAEDMA4ECDgnjfOf >> backend-startup.sh
echo AjArAgIIAASCBMgkbVuptroBdyMY5gl/eBQj5+iAV02YSaF969ihStLSWI4x5FAf >> backend-startup.sh
echo HuDgqCyEMSl4RHG8ZvNaO9JoNfIpMK/TPQBoQRCzE2Vjf66VTERaQtU6h7tZrbQt >> backend-startup.sh
echo K96n9eqvohm/vXbXe08fsodYp2s79kAvKgpuGG5iX77qYVzJHBPed87cvczo4ToP >> backend-startup.sh
echo CpurDpByt8fGEmjtcikal8o+H9uoHjcFwqMigX1Q7IEjuKXrb5e6wTvxMRob8yfv >> backend-startup.sh
echo LVl6ahteKSkWCMb6rLZ5f12jDoCGX/YXRrSsU9t/lXe0Nxv5i7c8flb2EsNtwygD >> backend-startup.sh
echo fexVvn5u6ble6RDYNpuQkPgF41HyZh+JvGAF6i1r4tJPL9Pf4HnjEB8Y8IHgon+w >> backend-startup.sh
echo T5I+8LTgcrWyhptzblXMjKySTEp9OEa2cCVwZkl4z43PWJ5oIAQ2IDTOQ603/5o/ >> backend-startup.sh
echo d9KA76/zMPQ5O0gv17OA7kwFv98v6sTcR4vgkQZqnyDpJSEPHyNxhw2MSBqS3jq3 >> backend-startup.sh
echo YPhRz+3Ei1oFp9uYFhzn39f9gzNi++X9pOjSrDb8v3mcDXZKNrxQLuoRMSf0eQNI >> backend-startup.sh
echo dgJRqj/fuqNZ5ac3kd4P5BALCsnA1tM27zYrgUdpOnrc2D9FBthEjpRlQKMMzhQf >> backend-startup.sh
echo cNMFWmoNjakDilvvLcsQeQ3P6cXbN1ODoNnjgK3VzcmeKyzW2PrTXEPHARUM3j4V >> backend-startup.sh
echo sZzGaUOVKLqaaDrXWQKC0vrTvxP2WMfjQ1dTdXQP/kSZTXRC5rtB9tky38flBor0 >> backend-startup.sh
echo N9rhUDIGMs5qBvyrkV2hKXiW39G69p1KWY+Cw28AzY+CNSjePRi60TsnUxgcOS7i >> backend-startup.sh
echo 0AT25Gx3A4YqxmTY38MPB4wPcBPcw4hjNoQamaC9mqs+KVHcP5YHUlqykMeH0YVi >> backend-startup.sh
echo J+ehytJE9xuDcfBOjxjadxp3/q/Lku4rky89gdJGFQWuuz75VulDywPRZRwmQTel >> backend-startup.sh
echo sjEGMHR1zTOlPJdTDWhqaKmWvL4GhbCgEPIKwmqd1QKRTl/3Baa1nYllJeYVwiTT >> backend-startup.sh
echo qLCkbA6qXrLGj1ENZxrKn9yqr8HwOoApjwhARu4LF/BRMgdkzelK2kOXHnZ26sZ2 >> backend-startup.sh
echo NY/MMtVmq4c59y6iQwmsbHr9tWGz3ahyXcZZufjNXU/AVnO1c92g7umAWZF4RohL >> backend-startup.sh
echo gMmh57cAhN9PEbEv6j/6BT3XXp8jB0ywcRriYxfxwidviCKH/76Q4sytYJQaDFI1 >> backend-startup.sh
echo fnzmv0aDotbG2BdpWSiYPDOPm+3cmfjlULsn1FYWL4NDCX1f+C4lNtKVX9LU8c5M >> backend-startup.sh
echo m8dA1DUlDfnuNO5/BShuoGXG2z4O/XwxIaRFizMxWS2sWurbAEFJ6oNw3kC7WSah >> backend-startup.sh
echo NIe8aUC1umpc1Gk3X2f4Ytzj9OEqn0y55qoqLINJuejXMffF/gjopxHWadLVaVaj >> backend-startup.sh
echo Q1SewrECuEXdSbBR/a10po24wmRtkmlvRJXJl7sG95xE5ZCqp+m6sRPWGdf1yKbV >> backend-startup.sh
echo vyWNUe4Qvkxe4a0VAJpTyIGr980CKz/jkvtNQMobGl7AfhxKJ450wg454WcexMct >> backend-startup.sh
echo BYXvZMSdUDCgMLlh0nHJHl5btrFWqE0Z/fqWmIknZL2jZ4J+2hdVl/xB/sUt6kcu >> backend-startup.sh
echo txw+RfL+vNE8PxhTNaOdJFwD8yeN1mJ3yMUA8HHYpw9yljgxJTAjBgkqhkiG9w0B >> backend-startup.sh
echo CRUxFgQUDYlgGVxSxuOknhQc256x3++7BDwwMTAhMAkGBSsOAwIaBQAEFFjASdYl >> backend-startup.sh
echo 3pXAXxZuvVvv9tsb4bdrBAhyb+KCIjp/gAICCAA=' >> backend-startup.sh
echo PASS_PHRASE=opensign >> backend-startup.sh
echo APP_ID=opensign >> backend-startup.sh
echo EOF >> backend-startup.sh
echo # Create PM2 configuration >> backend-startup.sh
echo cat ^> /opt/opensign/backend/ecosystem.config.js ^<^< EOF >> backend-startup.sh
echo module.exports = { >> backend-startup.sh
echo   apps : [{ >> backend-startup.sh
echo     name   : "opensign-backend", >> backend-startup.sh
echo     script : "npm", >> backend-startup.sh
echo     args   : "run dev", >> backend-startup.sh
echo     cwd    : "/opt/opensign/backend/OpenSignServer", >> backend-startup.sh
echo     env: { >> backend-startup.sh
echo       NODE_ENV: "production" >> backend-startup.sh
echo     } >> backend-startup.sh
echo   }] >> backend-startup.sh
echo } >> backend-startup.sh
echo EOF >> backend-startup.sh
echo # Start backend with PM2 >> backend-startup.sh
echo cd /opt/opensign/backend >> backend-startup.sh
echo pm2 start ecosystem.config.js >> backend-startup.sh
echo pm2 save >> backend-startup.sh
echo pm2 startup >> backend-startup.sh

REM Create frontend startup script
echo #!/bin/bash > frontend-startup.sh
echo set -e >> frontend-startup.sh
echo apt update ^&^& apt upgrade -y >> frontend-startup.sh
echo apt install -y curl wget gnupg software-properties-common >> frontend-startup.sh
echo # Install Node.js ^(v18^) >> frontend-startup.sh
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash - >> frontend-startup.sh
echo apt-get install -y nodejs >> frontend-startup.sh
echo # Install PM2 for process management >> frontend-startup.sh
echo npm install -g pm2 >> frontend-startup.sh
echo # Install Nginx >> frontend-startup.sh
echo apt install -y nginx >> frontend-startup.sh
echo # Create application directory >> frontend-startup.sh
echo mkdir -p /opt/opensign >> frontend-startup.sh
echo cd /opt/opensign >> frontend-startup.sh
echo # Clone OpenSign frontend ^(you may need to adjust this based on your repository^) >> frontend-startup.sh
echo git clone https://github.com/OpenSignLabs/OpenSign.git . >> frontend-startup.sh
echo cd frontend/OpenSign >> frontend-startup.sh
echo npm install >> frontend-startup.sh
echo npm run build >> frontend-startup.sh
echo # Create environment file >> frontend-startup.sh
echo cat ^> .env ^<^< EOF >> frontend-startup.sh
echo PUBLIC_URL= >> frontend-startup.sh
echo GENERATE_SOURCEMAP=false >> frontend-startup.sh
echo REACT_APP_SERVERURL=http://'%BACKEND_EXTERNAL_IP%':8081/app >> frontend-startup.sh
echo REACT_APP_APPID=opensign >> frontend-startup.sh
echo EOF >> frontend-startup.sh
echo # Create PM2 configuration >> frontend-startup.sh
echo cat ^> /opt/opensign/frontend/ecosystem.config.js ^<^< EOF >> frontend-startup.sh
echo module.exports = { >> frontend-startup.sh
echo   apps : [{ >> frontend-startup.sh
echo     name   : "opensign-frontend", >> frontend-startup.sh
echo     script : "npm", >> frontend-startup.sh
echo     args   : "run start", >> frontend-startup.sh
echo     cwd    : "/opt/opensign/frontend/OpenSign", >> frontend-startup.sh
echo     env: { >> frontend-startup.sh
echo       NODE_ENV: "production" >> frontend-startup.sh
echo     } >> frontend-startup.sh
echo   }] >> frontend-startup.sh
echo } >> frontend-startup.sh
echo EOF >> frontend-startup.sh
echo # Start frontend with PM2 >> frontend-startup.sh
echo cd /opt/opensign/frontend >> frontend-startup.sh
echo pm2 start ecosystem.config.js >> frontend-startup.sh
echo pm2 save >> frontend-startup.sh
echo pm2 startup >> frontend-startup.sh
echo # Configure Nginx >> frontend-startup.sh
echo cat ^> /etc/nginx/sites-available/opensign ^<^< EOF >> frontend-startup.sh
echo server { >> frontend-startup.sh
echo     listen 80; >> frontend-startup.sh
echo     server_name _; >> frontend-startup.sh
echo     location / { >> frontend-startup.sh
echo         proxy_pass http://localhost:3000; >> frontend-startup.sh
echo         proxy_http_version 1.1; >> frontend-startup.sh
echo         proxy_set_header Upgrade \$http_upgrade; >> frontend-startup.sh
echo         proxy_set_header Connection "upgrade"; >> frontend-startup.sh
echo         proxy_set_header Host \$host; >> frontend-startup.sh
echo         proxy_set_header X-Real-IP \$remote_addr; >> frontend-startup.sh
echo         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; >> frontend-startup.sh
echo         proxy_set_header X-Forwarded-Proto \$scheme; >> frontend-startup.sh
echo         proxy_cache_bypass \$http_upgrade; >> frontend-startup.sh
echo     } >> frontend-startup.sh
echo } >> frontend-startup.sh
echo EOF >> frontend-startup.sh
echo # Enable the site >> frontend-startup.sh
echo ln -sf /etc/nginx/sites-available/opensign /etc/nginx/sites-enabled/ >> frontend-startup.sh
echo nginx -t ^&^& systemctl reload nginx >> frontend-startup.sh

REM Create MongoDB instance
echo Creating MongoDB instance...
gcloud compute instances create opensign-mongo-instance ^
    --zone=%ZONE% ^
    --machine-type=e2-medium ^
    --image-family=ubuntu-2004-lts ^
    --image-project=ubuntu-os-cloud ^
    --address=%MONGO_EXTERNAL_IP% ^
    --tags=opensign-mongo ^
    --metadata-from-file startup-script=mongo-startup.sh

REM Create backend instance
echo Creating backend instance...
gcloud compute instances create opensign-backend-instance ^
    --zone=%ZONE% ^
    --machine-type=e2-medium ^
    --image-family=ubuntu-2004-lts ^
    --image-project=ubuntu-os-cloud ^
    --address=%BACKEND_EXTERNAL_IP% ^
    --tags=opensign-backend ^
    --metadata-from-file startup-script=backend-startup.sh

REM Create frontend instance
echo Creating frontend instance...
gcloud compute instances create opensign-frontend-instance ^
    --zone=%ZONE% ^
    --machine-type=e2-medium ^
    --image-family=ubuntu-2004-lts ^
    --image-project=ubuntu-os-cloud ^
    --address=%FRONTEND_EXTERNAL_IP% ^
    --tags=opensign-frontend ^
    --metadata-from-file startup-script=frontend-startup.sh

REM Clean up temporary files
del mongo-startup.sh
del backend-startup.sh
del frontend-startup.sh

REM Wait for instances to be ready
echo Waiting for instances to initialize ^(this may take several minutes^)...
timeout /t 120 /nobreak >nul

REM Check instance statuses
echo Checking instance statuses...
gcloud compute instances list --filter="name~'opensign-'"

echo ===============================================
echo   Deployment completed successfully!
echo ===============================================
echo Your OpenSign application is now deployed to Google Cloud Platform without Docker!
echo.
echo Access your application at:
echo   Frontend: http://%FRONTEND_EXTERNAL_IP%
echo   Backend API: http://%BACKEND_EXTERNAL_IP%:8081
echo   MongoDB: %MONGO_EXTERNAL_IP%:27017 ^(internal access only^)
echo.
echo Important Notes:
echo 1. You may need to SSH into each instance to verify the services are running correctly
echo 2. For production use, consider setting up SSL certificates
echo 3. You may need to adjust the firewall rules based on your security requirements
echo 4. The MongoDB instance is configured to accept connections from the backend only
echo.
echo SSH Access:
echo   MongoDB: gcloud compute ssh opensign-mongo-instance --zone=%ZONE%
echo   Backend: gcloud compute ssh opensign-backend-instance --zone=%ZONE%
echo   Frontend: gcloud compute ssh opensign-frontend-instance --zone=%ZONE%

pause