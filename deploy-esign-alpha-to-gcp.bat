@echo off
setlocal enabledelayedexpansion

REM Deployment script for Esign Alpha to Google Cloud Platform
REM Project ID: esign-alpha-474811
REM Project Number: 498925996411

echo Starting Esign Alpha deployment to Google Cloud Platform...

REM Check if required tools are installed
echo Checking for required tools...
where gcloud >nul 2>&1
if %errorlevel% neq 0 (
    echo Google Cloud SDK is not installed. Please install it first.
    echo Visit https://cloud.google.com/sdk/docs/install for installation instructions.
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install it first.
    exit /b 1
)

where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo OpenSSL is not installed. Please install it first.
    exit /b 1
)

REM Set Google Cloud project details
set PROJECT_ID=esign-alpha-474811
set PROJECT_NUMBER=498925996411
set REGION=us-central1
set ZONE=us-central1-a

echo Using Google Cloud Project:
echo   Project ID: %PROJECT_ID%
echo   Project Number: %PROJECT_NUMBER%

REM Generate secure master key
for /f "delims=" %%i in ('openssl rand -base64 32') do set MASTER_KEY=%%i
echo Generated secure master key

REM Set Google Cloud project
echo Setting Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required services
echo Enabling required Google Cloud services...
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

REM Configure Docker to use gcloud as a credential helper
echo Configuring Docker for Google Container Registry...
gcloud auth configure-docker

REM Build and push Docker images
echo Building and pushing Docker images...

REM Build backend image
echo Building backend image...
cd backend\OpenSignServer
docker build -t gcr.io/%PROJECT_ID%/opensign-backend:latest .
echo Pushing backend image...
docker push gcr.io/%PROJECT_ID%/opensign-backend:latest

REM Build frontend image
echo Building frontend image...
cd ..\..\frontend\OpenSign
docker build -t gcr.io/%PROJECT_ID%/opensign-frontend:latest .
echo Pushing frontend image...
docker push gcr.io/%PROJECT_ID%/opensign-frontend:latest

REM Return to root directory
cd ..\..

REM Create GKE cluster
echo Creating GKE cluster...
gcloud container clusters create opensign-cluster ^
    --num-nodes=3 ^
    --zone=%ZONE% ^
    --machine-type=e2-medium ^
    --enable-autoscaling ^
    --min-nodes=1 ^
    --max-nodes=5

REM Get cluster credentials
echo Getting cluster credentials...
gcloud container clusters get-credentials opensign-cluster --zone=%ZONE%

REM Create Kubernetes deployment file with proper configurations for Esign Alpha
(
echo apiVersion: apps/v1
echo kind: Deployment
echo metadata:
echo   name: opensign-mongo
echo spec:
echo   replicas: 1
echo   selector:
echo     matchLabels:
echo       app: opensign-mongo
echo   template:
echo     metadata:
echo       labels:
echo         app: opensign-mongo
echo     spec:
echo       containers:
echo       - name: mongo
echo         image: mongo:6.0
echo         ports:
echo         - containerPort: 27017
echo         env:
echo         - name: MONGO_INITDB_ROOT_USERNAME
echo           value: "admin"
echo         - name: MONGO_INITDB_ROOT_PASSWORD
echo           value: "password"
echo         volumeMounts:
echo         - name: mongo-storage
echo           mountPath: /data/db
echo       volumes:
echo       - name: mongo-storage
echo         emptyDir: {}
echo ---
echo apiVersion: v1
echo kind: Service
echo metadata:
echo   name: opensign-mongo-service
echo spec:
echo   selector:
echo     app: opensign-mongo
echo   ports:
echo     - protocol: TCP
echo       port: 27017
echo       targetPort: 27017
echo   type: ClusterIP
echo ---
echo apiVersion: apps/v1
echo kind: Deployment
echo metadata:
echo   name: opensign-backend
echo spec:
echo   replicas: 2
echo   selector:
echo     matchLabels:
echo       app: opensign-backend
echo   template:
echo     metadata:
echo       labels:
echo         app: opensign-backend
echo     spec:
echo       containers:
echo       - name: backend
echo         image: gcr.io/%PROJECT_ID%/opensign-backend:latest
echo         ports:
echo         - containerPort: 8081
echo         env:
echo         - name: APP_ID
echo           value: "opensign"
echo         - name: SERVER_URL
echo           value: "http://opensign-backend-service:8081/app"
echo         - name: MASTER_KEY
echo           value: "%MASTER_KEY%"
echo         - name: DATABASE_URI
echo           value: "mongodb://admin:password@opensign-mongo-service:27017/opensign?authSource=admin"
echo         - name: PORT
echo           value: "8081"
echo         - name: USE_LOCAL
echo           value: "true"
echo         volumeMounts:
echo         - name: backend-logs
echo           mountPath: /app/logs
echo       volumes:
echo       - name: backend-logs
echo         emptyDir: {}
echo ---
echo apiVersion: v1
echo kind: Service
echo metadata:
echo   name: opensign-backend-service
echo spec:
echo   selector:
echo     app: opensign-backend
echo   ports:
echo     - protocol: TCP
echo       port: 8081
echo       targetPort: 8081
echo   type: ClusterIP
echo ---
echo apiVersion: apps/v1
echo kind: Deployment
echo metadata:
echo   name: opensign-frontend
echo spec:
echo   replicas: 2
echo   selector:
echo     matchLabels:
echo       app: opensign-frontend
echo   template:
echo     metadata:
echo       labels:
echo         app: opensign-frontend
echo     spec:
echo       containers:
echo       - name: frontend
echo         image: gcr.io/%PROJECT_ID%/opensign-frontend:latest
echo         ports:
echo         - containerPort: 80
echo         env:
echo         - name: REACT_APP_SERVERURL
echo           value: "http://opensign-backend-service:8081/app"
echo         - name: REACT_APP_APPID
echo           value: "opensign"
echo ---
echo apiVersion: v1
echo kind: Service
echo metadata:
echo   name: opensign-frontend-service
echo spec:
echo   selector:
echo     app: opensign-frontend
echo   ports:
echo     - protocol: TCP
echo       port: 80
echo       targetPort: 80
echo   type: LoadBalancer
) > k8s-deployment-esign-alpha.yaml

REM Deploy to Kubernetes
echo Deploying to Kubernetes...
kubectl apply -f k8s-deployment-esign-alpha.yaml

REM Wait for services to be ready
echo Waiting for services to be ready (this may take several minutes)...
kubectl wait --for=condition=available --timeout=600s deployment/opensign-backend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-frontend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-mongo

REM Get service information
echo Deployment completed!
echo Service information:
kubectl get services

echo Your Esign Alpha application is now deployed to Google Cloud Platform!
for /f "tokens=*" %%i in ('kubectl get service opensign-frontend-service -o jsonpath^="{.status.loadBalancer.ingress[0].ip}"') do set EXTERNAL_IP=%%i
echo Frontend will be accessible at: http://%EXTERNAL_IP%
echo Backend API will be accessible at: http://%EXTERNAL_IP%:8081

REM Save deployment information
(
echo Esign Alpha Deployment Information
echo ==================================
echo.
echo Project ID: %PROJECT_ID%
echo Project Number: %PROJECT_NUMBER%
echo Deployment Date: %date% %time%
echo.
echo Frontend URL: http://%EXTERNAL_IP%
echo Backend API URL: http://%EXTERNAL_IP%:8081
echo.
echo Master Key: %MASTER_KEY%
echo.
echo To access your cluster later, run:
echo gcloud container clusters get-credentials opensign-cluster --zone=%ZONE% --project=%PROJECT_ID%
echo.
echo To check the status of your deployment:
echo kubectl get services
echo kubectl get pods
) > deployment-info.txt

echo Deployment information saved to deployment-info.txt