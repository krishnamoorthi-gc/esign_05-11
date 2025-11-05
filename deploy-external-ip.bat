@echo off
setlocal enabledelayedexpansion

echo Starting Esign SAAS deployment with external IP configuration...

REM Check if required tools are installed
echo Checking for required tools...
where gcloud >nul 2>&1
if %errorlevel% neq 0 (
    echo Google Cloud SDK is not installed. Please install it first.
    exit /b 1
)

where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    echo kubectl is not installed. Please install it first.
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install it first.
    exit /b 1
)

REM Set your Google Cloud project ID
set /p PROJECT_ID="Please enter your Google Cloud Project ID: "

REM Set your desired external IPs
set /p BACKEND_EXTERNAL_IP="Please enter your desired external IP for the backend service: "
set /p FRONTEND_EXTERNAL_IP="Please enter your desired external IP for the frontend service: "

REM Update the Kubernetes deployment file with actual values
echo Updating Kubernetes deployment configuration...
powershell -Command "(gc k8s-external-ip-deployment.yaml) -replace 'YOUR_PROJECT_ID', '%PROJECT_ID%' | Out-File -encoding ASCII k8s-external-ip-deployment.yaml"
powershell -Command "(gc k8s-external-ip-deployment.yaml) -replace 'YOUR_BACKEND_EXTERNAL_IP', '%BACKEND_EXTERNAL_IP%' | Out-File -encoding ASCII k8s-external-ip-deployment.yaml"
powershell -Command "(gc k8s-external-ip-deployment.yaml) -replace 'YOUR_FRONTEND_EXTERNAL_IP', '%FRONTEND_EXTERNAL_IP%' | Out-File -encoding ASCII k8s-external-ip-deployment.yaml"

REM Generate a secure master key
for /f "delims=" %%a in ('powershell -Command "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((-join(1..32|%{[char](Get-Random -Max 127 -Min 33)}))))"') do set MASTER_KEY=%%a
powershell -Command "(gc k8s-external-ip-deployment.yaml) -replace 'your_secure_master_key_here', '%MASTER_KEY%' | Out-File -encoding ASCII k8s-external-ip-deployment.yaml"

REM Update the docker-compose file with actual values
echo Updating Docker Compose configuration...
powershell -Command "(gc docker-compose-external-ip.yml) -replace 'YOUR_EXTERNAL_IP', '%BACKEND_EXTERNAL_IP%' | Out-File -encoding ASCII docker-compose-external-ip.yml"
powershell -Command "(gc docker-compose-external-ip.yml) -replace 'your_secure_master_key_here', '%MASTER_KEY%' | Out-File -encoding ASCII docker-compose-external-ip.yml"

REM Set Google Cloud project
echo Setting Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required services
echo Enabling required Google Cloud services...
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com

REM Create GKE cluster
echo Creating GKE cluster...
gcloud container clusters create esign-cluster --num-nodes=3 --zone=us-central1-a --machine-type=e2-medium

REM Get cluster credentials
echo Getting cluster credentials...
gcloud container clusters get-credentials esign-cluster --zone=us-central1-a

REM Reserve external IP addresses
echo Reserving external IP addresses...
gcloud compute addresses create esign-backend-ip --region=us-central1
gcloud compute addresses create esign-frontend-ip --region=us-central1

REM Get reserved IP addresses
for /f "delims=" %%a in ('gcloud compute addresses describe esign-backend-ip --region=us-central1 --format^="value^(address^)"') do set RESERVED_BACKEND_IP=%%a
for /f "delims=" %%b in ('gcloud compute addresses describe esign-frontend-ip --region=us-central1 --format^="value^(address^)"') do set RESERVED_FRONTEND_IP=%%b

REM Update the reserved IPs in the deployment file
powershell -Command "(gc k8s-external-ip-deployment.yaml) -replace '%BACKEND_EXTERNAL_IP%', '!RESERVED_BACKEND_IP!' | Out-File -encoding ASCII k8s-external-ip-deployment.yaml"
powershell -Command "(gc k8s-external-ip-deployment.yaml) -replace '%FRONTEND_EXTERNAL_IP%', '!RESERVED_FRONTEND_IP!' | Out-File -encoding ASCII k8s-external-ip-deployment.yaml"

REM Build and push Docker images
echo Building and pushing Docker images...

REM Build backend image
cd backend\OpenSignServer
docker build -t gcr.io/%PROJECT_ID%/opensign-backend:latest .
docker push gcr.io/%PROJECT_ID%/opensign-backend:latest

REM Build frontend image
cd ..\..\frontend\OpenSign
docker build -t gcr.io/%PROJECT_ID%/opensign-frontend:latest .
docker push gcr.io/%PROJECT_ID%/opensign-frontend:latest

REM Return to root directory
cd ..\..

REM Deploy to Kubernetes
echo Deploying to Kubernetes...
kubectl apply -f k8s-external-ip-deployment.yaml

echo Deployment completed!
echo Service information:
kubectl get services

echo Your Esign SAAS application is now deployed with external IP configuration!
echo Backend will be accessible at: http://!RESERVED_BACKEND_IP!:8081
echo Frontend will be accessible at: http://!RESERVED_FRONTEND_IP!