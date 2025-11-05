#!/bin/bash

# Deployment script for Esign SAAS with external IP configuration

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Esign SAAS deployment with external IP configuration...${NC}"

# Check if required tools are installed
echo -e "${YELLOW}Checking for required tools...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Google Cloud SDK is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Set your Google Cloud project ID
echo -e "${YELLOW}Please enter your Google Cloud Project ID:${NC}"
read PROJECT_ID

# Set your desired external IPs
echo -e "${YELLOW}Please enter your desired external IP for the backend service:${NC}"
read BACKEND_EXTERNAL_IP

echo -e "${YELLOW}Please enter your desired external IP for the frontend service:${NC}"
read FRONTEND_EXTERNAL_IP

# Update the Kubernetes deployment file with actual values
echo -e "${YELLOW}Updating Kubernetes deployment configuration...${NC}"
sed -i "s/YOUR_PROJECT_ID/${PROJECT_ID}/g" k8s-external-ip-deployment.yaml
sed -i "s/YOUR_BACKEND_EXTERNAL_IP/${BACKEND_EXTERNAL_IP}/g" k8s-external-ip-deployment.yaml
sed -i "s/YOUR_FRONTEND_EXTERNAL_IP/${FRONTEND_EXTERNAL_IP}/g" k8s-external-ip-deployment.yaml
sed -i "s/your_secure_master_key_here/$(openssl rand -base64 32)/g" k8s-external-ip-deployment.yaml

# Update the docker-compose file with actual values
echo -e "${YELLOW}Updating Docker Compose configuration...${NC}"
sed -i "s/YOUR_EXTERNAL_IP/${BACKEND_EXTERNAL_IP}/g" docker-compose-external-ip.yml
sed -i "s/your_secure_master_key_here/$(openssl rand -base64 32)/g" docker-compose-external-ip.yml

# Set Google Cloud project
echo -e "${YELLOW}Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required services
echo -e "${YELLOW}Enabling required Google Cloud services...${NC}"
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Create GKE cluster
echo -e "${YELLOW}Creating GKE cluster...${NC}"
gcloud container clusters create esign-cluster \
    --num-nodes=3 \
    --zone=us-central1-a \
    --machine-type=e2-medium

# Get cluster credentials
echo -e "${YELLOW}Getting cluster credentials...${NC}"
gcloud container clusters get-credentials esign-cluster --zone=us-central1-a

# Reserve external IP addresses
echo -e "${YELLOW}Reserving external IP addresses...${NC}"
gcloud compute addresses create esign-backend-ip --region=us-central1
gcloud compute addresses create esign-frontend-ip --region=us-central1

# Update the reserved IPs in the deployment file
RESERVED_BACKEND_IP=$(gcloud compute addresses describe esign-backend-ip --region=us-central1 --format="value(address)")
RESERVED_FRONTEND_IP=$(gcloud compute addresses describe esign-frontend-ip --region=us-central1 --format="value(address)")

sed -i "s/YOUR_BACKEND_EXTERNAL_IP/${RESERVED_BACKEND_IP}/g" k8s-external-ip-deployment.yaml
sed -i "s/YOUR_FRONTEND_EXTERNAL_IP/${RESERVED_FRONTEND_IP}/g" k8s-external-ip-deployment.yaml

# Build and push Docker images
echo -e "${YELLOW}Building and pushing Docker images...${NC}"
# Build backend image
cd backend/OpenSignServer
docker build -t gcr.io/$PROJECT_ID/opensign-backend:latest .
docker push gcr.io/$PROJECT_ID/opensign-backend:latest

# Build frontend image
cd ../../frontend/OpenSign
docker build -t gcr.io/$PROJECT_ID/opensign-frontend:latest .
docker push gcr.io/$PROJECT_ID/opensign-frontend:latest

# Return to root directory
cd ../../

# Deploy to Kubernetes
echo -e "${YELLOW}Deploying to Kubernetes...${NC}"
kubectl apply -f k8s-external-ip-deployment.yaml

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
kubectl wait --for=condition=available --timeout=600s deployment/opensign-backend
kubectl wait --for=condition=available --timeout=600s deployment/opensign-frontend

# Get service information
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Service information:${NC}"
kubectl get services

echo -e "${GREEN}Your Esign SAAS application is now deployed with external IP configuration!${NC}"
echo -e "${YELLOW}Backend will be accessible at: http://${RESERVED_BACKEND_IP}:8081${NC}"
echo -e "${YELLOW}Frontend will be accessible at: http://${RESERVED_FRONTEND_IP}${NC}"