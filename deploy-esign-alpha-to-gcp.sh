#!/bin/bash

# Deployment script for Esign Alpha to Google Cloud Platform
# Project ID: esign-alpha-474811
# Project Number: 498925996411

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Esign Alpha deployment to Google Cloud Platform...${NC}"

# Check if required tools are installed
echo -e "${YELLOW}Checking for required tools...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Google Cloud SDK is not installed. Please install it first.${NC}"
    echo -e "${YELLOW}Visit https://cloud.google.com/sdk/docs/install for installation instructions.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}OpenSSL is not installed. Please install it first.${NC}"
    exit 1
fi

# Set Google Cloud project details
PROJECT_ID="esign-alpha-474811"
PROJECT_NUMBER="498925996411"
REGION="us-central1"
ZONE="us-central1-a"

echo -e "${YELLOW}Using Google Cloud Project:${NC}"
echo -e "${YELLOW}  Project ID: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}  Project Number: ${PROJECT_NUMBER}${NC}"

# Generate secure master key
MASTER_KEY=$(openssl rand -base64 32)
echo -e "${YELLOW}Generated secure master key${NC}"

# Set Google Cloud project
echo -e "${YELLOW}Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required services
echo -e "${YELLOW}Enabling required Google Cloud services...${NC}"
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Configure Docker to use gcloud as a credential helper
echo -e "${YELLOW}Configuring Docker for Google Container Registry...${NC}"
gcloud auth configure-docker

# Build and push Docker images
echo -e "${YELLOW}Building and pushing Docker images...${NC}"

# Build backend image
echo -e "${YELLOW}Building backend image...${NC}"
cd backend/OpenSignServer
docker build -t gcr.io/$PROJECT_ID/opensign-backend:latest .
echo -e "${YELLOW}Pushing backend image...${NC}"
docker push gcr.io/$PROJECT_ID/opensign-backend:latest

# Build frontend image
echo -e "${YELLOW}Building frontend image...${NC}"
cd ../../frontend/OpenSign
docker build -t gcr.io/$PROJECT_ID/opensign-frontend:latest .
echo -e "${YELLOW}Pushing frontend image...${NC}"
docker push gcr.io/$PROJECT_ID/opensign-frontend:latest

# Return to root directory
cd ../../

# Create GKE cluster
echo -e "${YELLOW}Creating GKE cluster...${NC}"
gcloud container clusters create opensign-cluster \
    --num-nodes=3 \
    --zone=${ZONE} \
    --machine-type=e2-medium \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=5

# Get cluster credentials
echo -e "${YELLOW}Getting cluster credentials...${NC}"
gcloud container clusters get-credentials opensign-cluster --zone=${ZONE}

# Create Kubernetes deployment file with proper configurations for Esign Alpha
cat > k8s-deployment-esign-alpha.yaml << EOF
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
EOF

# Deploy to Kubernetes
echo -e "${YELLOW}Deploying to Kubernetes...${NC}"
kubectl apply -f k8s-deployment-esign-alpha.yaml

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready (this may take several minutes)...${NC}"
kubectl wait --for=condition=available --timeout=600s deployment/opensign-backend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-frontend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-mongo

# Get service information
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Service information:${NC}"
kubectl get services

echo -e "${GREEN}Your Esign Alpha application is now deployed to Google Cloud Platform!${NC}"
EXTERNAL_IP=$(kubectl get service opensign-frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo -e "${YELLOW}Frontend will be accessible at: http://${EXTERNAL_IP}${NC}"
echo -e "${YELLOW}Backend API will be accessible at: http://${EXTERNAL_IP}:8081${NC}"

# Save deployment information
cat > deployment-info.txt << EOF
Esign Alpha Deployment Information
==================================

Project ID: $PROJECT_ID
Project Number: $PROJECT_NUMBER
Deployment Date: $(date)

Frontend URL: http://${EXTERNAL_IP}
Backend API URL: http://${EXTERNAL_IP}:8081

Master Key: $MASTER_KEY

To access your cluster later, run:
gcloud container clusters get-credentials opensign-cluster --zone=$ZONE --project=$PROJECT_ID

To check the status of your deployment:
kubectl get services
kubectl get pods
EOF

echo -e "${YELLOW}Deployment information saved to deployment-info.txt${NC}"