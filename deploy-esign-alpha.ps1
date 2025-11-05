# PowerShell script for deploying Esign Alpha to Google Cloud Platform
# Project ID: esign-alpha-474811
# Project Number: 498925996411

Write-Host "Starting Esign Alpha deployment to Google Cloud Platform..." -ForegroundColor Green

# Check if required tools are installed
Write-Host "Checking for required tools..." -ForegroundColor Yellow

# Check Google Cloud SDK
try {
    $gcloudVersion = gcloud --version
    Write-Host "Google Cloud SDK is installed" -ForegroundColor Green
} catch {
    Write-Host "Google Cloud SDK is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit https://cloud.google.com/sdk/docs/install for installation instructions." -ForegroundColor Yellow
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check kubectl
try {
    $kubectlVersion = kubectl version --client
    Write-Host "kubectl is installed" -ForegroundColor Green
} catch {
    Write-Host "kubectl is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Set Google Cloud project details
$PROJECT_ID = "esign-alpha-474811"
$PROJECT_NUMBER = "498925996411"
$REGION = "us-central1"
$ZONE = "us-central1-a"

Write-Host "Using Google Cloud Project:" -ForegroundColor Yellow
Write-Host "  Project ID: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "  Project Number: $PROJECT_NUMBER" -ForegroundColor Yellow

# Set Google Cloud project
Write-Host "Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required services
Write-Host "Enabling required Google Cloud services..." -ForegroundColor Yellow
gcloud services enable container.googleapis.com compute.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Configure Docker to use gcloud as a credential helper
Write-Host "Configuring Docker for Google Container Registry..." -ForegroundColor Yellow
gcloud auth configure-docker

# Generate secure master key
Write-Host "Generating secure master key..." -ForegroundColor Yellow
$MASTER_KEY = openssl rand -base64 32
Write-Host "Generated secure master key" -ForegroundColor Green

# Build and push Docker images
Write-Host "Building and pushing Docker images..." -ForegroundColor Yellow

# Build backend image
Write-Host "Building backend image..." -ForegroundColor Yellow
Set-Location -Path "backend\OpenSignServer"
docker build -t "gcr.io/$PROJECT_ID/opensign-backend:latest" .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing backend image..." -ForegroundColor Yellow
    docker push "gcr.io/$PROJECT_ID/opensign-backend:latest"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend image pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to push backend image" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Failed to build backend image" -ForegroundColor Red
    exit 1
}

# Build frontend image
Write-Host "Building frontend image..." -ForegroundColor Yellow
Set-Location -Path "..\..\frontend\OpenSign"
docker build -t "gcr.io/$PROJECT_ID/opensign-frontend:latest" .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing frontend image..." -ForegroundColor Yellow
    docker push "gcr.io/$PROJECT_ID/opensign-frontend:latest"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend image pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to push frontend image" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Failed to build frontend image" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location -Path "..\.."

# Create GKE cluster
Write-Host "Creating GKE cluster..." -ForegroundColor Yellow
gcloud container clusters create opensign-cluster `
    --num-nodes=3 `
    --zone=$ZONE `
    --machine-type=e2-medium `
    --enable-autoscaling `
    --min-nodes=1 `
    --max-nodes=5

if ($LASTEXITCODE -eq 0) {
    Write-Host "GKE cluster created successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create GKE cluster" -ForegroundColor Red
    exit 1
}

# Get cluster credentials
Write-Host "Getting cluster credentials..." -ForegroundColor Yellow
gcloud container clusters get-credentials opensign-cluster --zone=$ZONE

# Create Kubernetes deployment file with proper configurations for Esign Alpha
Write-Host "Creating Kubernetes deployment file..." -ForegroundColor Yellow
$k8sDeployment = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opensign-mongo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: opensign-mongo
  template:
    metadata:
      labels:
        app: opensign-mongo
    spec:
      containers:
      - name: mongo
        image: mongo:6.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "password"
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
      volumes:
      - name: mongo-storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: opensign-mongo-service
spec:
  selector:
    app: opensign-mongo
  ports:
    - protocol: TCP
      port: 27017
      targetPort: 27017
  type: ClusterIP

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opensign-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: opensign-backend
  template:
    metadata:
      labels:
        app: opensign-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/$PROJECT_ID/opensign-backend:latest
        ports:
        - containerPort: 8081
        env:
        - name: APP_ID
          value: "opensign"
        - name: SERVER_URL
          value: "http://opensign-backend-service:8081/app"
        - name: MASTER_KEY
          value: "$MASTER_KEY"
        - name: DATABASE_URI
          value: "mongodb://admin:password@opensign-mongo-service:27017/opensign?authSource=admin"
        - name: PORT
          value: "8081"
        - name: USE_LOCAL
          value: "true"
        volumeMounts:
        - name: backend-logs
          mountPath: /app/logs
      volumes:
      - name: backend-logs
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: opensign-backend-service
spec:
  selector:
    app: opensign-backend
  ports:
    - protocol: TCP
      port: 8081
      targetPort: 8081
  type: ClusterIP

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opensign-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: opensign-frontend
  template:
    metadata:
      labels:
        app: opensign-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/$PROJECT_ID/opensign-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_SERVERURL
          value: "http://opensign-backend-service:8081/app"
        - name: REACT_APP_APPID
          value: "opensign"

---
apiVersion: v1
kind: Service
metadata:
  name: opensign-frontend-service
spec:
  selector:
    app: opensign-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
"@

$k8sDeployment | Out-File -FilePath "k8s-deployment-esign-alpha.yaml" -Encoding UTF8

Write-Host "Kubernetes deployment file created" -ForegroundColor Green

# Deploy to Kubernetes
Write-Host "Deploying to Kubernetes..." -ForegroundColor Yellow
kubectl apply -f k8s-deployment-esign-alpha.yaml

if ($LASTEXITCODE -eq 0) {
    Write-Host "Kubernetes deployment successful" -ForegroundColor Green
} else {
    Write-Host "Failed to deploy to Kubernetes" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "Waiting for services to be ready (this may take several minutes)..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=600s deployment/opensign-backend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-frontend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-mongo

# Get service information
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Service information:" -ForegroundColor Yellow
kubectl get services

# Get external IP
$EXTERNAL_IP = kubectl get service opensign-frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

Write-Host "Your Esign Alpha application is now deployed to Google Cloud Platform!" -ForegroundColor Green
Write-Host "Frontend will be accessible at: http://$EXTERNAL_IP" -ForegroundColor Yellow
Write-Host "Backend API will be accessible at: http://$EXTERNAL_IP:8081" -ForegroundColor Yellow

# Save deployment information
$deploymentInfo = @"
Esign Alpha Deployment Information
==================================

Project ID: $PROJECT_ID
Project Number: $PROJECT_NUMBER
Deployment Date: $(Get-Date)

Frontend URL: http://$EXTERNAL_IP
Backend API URL: http://$EXTERNAL_IP:8081

Master Key: $MASTER_KEY

To access your cluster later, run:
gcloud container clusters get-credentials opensign-cluster --zone=$ZONE --project=$PROJECT_ID

To check the status of your deployment:
kubectl get services
kubectl get pods
"@

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding UTF8
Write-Host "Deployment information saved to deployment-info.txt" -ForegroundColor Yellow

Write-Host "Esign Alpha deployment completed successfully!" -ForegroundColor Green