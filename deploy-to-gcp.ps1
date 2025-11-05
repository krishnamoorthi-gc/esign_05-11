# Deployment script for OpenSign to Google Cloud Platform using PowerShell

Write-Host "Starting OpenSign deployment to Google Cloud Platform..." -ForegroundColor Green

# Check if required tools are installed
Write-Host "Checking for required tools..." -ForegroundColor Yellow
$gcloudExists = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudExists) {
    Write-Host "Google Cloud SDK is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit https://cloud.google.com/sdk/docs/install for installation instructions." -ForegroundColor Yellow
    exit 1
}

$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerExists) {
    Write-Host "Docker is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Set your Google Cloud project ID
$PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"

# Set your desired region (change if needed)
$REGION = "us-central1"
$ZONE = "us-central1-a"

# Generate secure master key
$MASTER_KEY = openssl rand -base64 32
Write-Host "Generated secure master key" -ForegroundColor Yellow

# Set Google Cloud project
Write-Host "Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required services
Write-Host "Enabling required Google Cloud services..." -ForegroundColor Yellow
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Configure Docker to use gcloud as a credential helper
Write-Host "Configuring Docker for Google Container Registry..." -ForegroundColor Yellow
gcloud auth configure-docker

# Build and push Docker images
Write-Host "Building and pushing Docker images..." -ForegroundColor Yellow

# Build backend image
Write-Host "Building backend image..." -ForegroundColor Yellow
Set-Location -Path "backend\OpenSignServer"
docker build -t "gcr.io/$PROJECT_ID/opensign-backend:latest" .
Write-Host "Pushing backend image..." -ForegroundColor Yellow
docker push "gcr.io/$PROJECT_ID/opensign-backend:latest"

# Build frontend image
Write-Host "Building frontend image..." -ForegroundColor Yellow
Set-Location -Path "..\..\frontend\OpenSign"
docker build -t "gcr.io/$PROJECT_ID/opensign-frontend:latest" .
Write-Host "Pushing frontend image..." -ForegroundColor Yellow
docker push "gcr.io/$PROJECT_ID/opensign-frontend:latest"

# Return to root directory
Set-Location -Path "..\.."

# Create GKE cluster
Write-Host "Creating GKE cluster..." -ForegroundColor Yellow
gcloud container clusters create opensign-cluster `
    --num-nodes=3 `
    --zone=$ZONE `
    --machine-type=e2-medium

# Get cluster credentials
Write-Host "Getting cluster credentials..." -ForegroundColor Yellow
gcloud container clusters get-credentials opensign-cluster --zone=$ZONE

# Create Kubernetes deployment file
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
  replicas: 1
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
  replicas: 1
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

$k8sDeployment | Out-File -FilePath "k8s-deployment.yaml" -Encoding UTF8

# Deploy to Kubernetes
Write-Host "Deploying to Kubernetes..." -ForegroundColor Yellow
kubectl apply -f k8s-deployment.yaml

# Wait for services to be ready
Write-Host "Waiting for services to be ready (this may take several minutes)..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=600s deployment/opensign-backend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-frontend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-mongo

# Get service information
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Service information:" -ForegroundColor Yellow
kubectl get services

Write-Host "Your OpenSign application is now deployed to Google Cloud Platform!" -ForegroundColor Green
$externalIP = kubectl get service opensign-frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
Write-Host "Frontend will be accessible at: http://$externalIP" -ForegroundColor Yellow
Write-Host "Backend API will be accessible at: http://$externalIP`:8081" -ForegroundColor Yellow