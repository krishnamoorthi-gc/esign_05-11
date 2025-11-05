#!/bin/bash

# Quick deployment script for Esign SAAS with external IP
# This script automates the key steps for deployment

set -e  # Exit on any error

echo "Esign SAAS Quick Deployment with External IP"

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK not found"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl not found"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found"
    exit 1
fi

# Get user input
echo "Please enter your Google Cloud Project ID:"
read PROJECT_ID

echo "Please enter your desired region (e.g., us-central1):"
read REGION

# Set project
echo "Setting project..."
gcloud config set project $PROJECT_ID

# Enable services
echo "Enabling required services..."
gcloud services enable container.googleapis.com compute.googleapis.com cloudbuild.googleapis.com

# Reserve IPs
echo "Reserving external IP addresses..."
gcloud compute addresses create opensign-frontend-ip --region=$REGION
gcloud compute addresses create opensign-backend-ip --region=$REGION

# Get reserved IPs
FRONTEND_IP=$(gcloud compute addresses describe opensign-frontend-ip --region=$REGION --format="value(address)")
BACKEND_IP=$(gcloud compute addresses describe opensign-backend-ip --region=$REGION --format="value(address)")

echo "Reserved frontend IP: $FRONTEND_IP"
echo "Reserved backend IP: $BACKEND_IP"

# Create cluster
echo "Creating GKE cluster..."
gcloud container clusters create opensign-cluster \
    --num-nodes=3 \
    --zone=${REGION}-a \
    --machine-type=e2-medium

# Get credentials
echo "Getting cluster credentials..."
gcloud container clusters get-credentials opensign-cluster --zone=${REGION}-a

# Build and push images
echo "Building and pushing Docker images..."

# Backend
cd backend/OpenSignServer
echo "Building backend image..."
docker build -t gcr.io/$PROJECT_ID/opensign-backend:latest .
echo "Pushing backend image..."
docker push gcr.io/$PROJECT_ID/opensign-backend:latest

# Frontend
cd ../../frontend/OpenSign
echo "Building frontend image..."
docker build -t gcr.io/$PROJECT_ID/opensign-frontend:latest .
echo "Pushing frontend image..."
docker push gcr.io/$PROJECT_ID/opensign-frontend:latest

# Return to root
cd ../../

# Update deployment file with actual values
echo "Updating deployment configuration..."
cp k8s-external-ip-deployment.yaml k8s-external-ip-deployment.yaml.bak

sed -i "s/YOUR_PROJECT_ID/${PROJECT_ID}/g" k8s-external-ip-deployment.yaml
sed -i "s/YOUR_BACKEND_EXTERNAL_IP/${BACKEND_IP}/g" k8s-external-ip-deployment.yaml
sed -i "s/YOUR_FRONTEND_EXTERNAL_IP/${FRONTEND_IP}/g" k8s-external-ip-deployment.yaml

# Generate secure master key
MASTER_KEY=$(openssl rand -base64 32)
sed -i "s/your_secure_master_key_here/${MASTER_KEY}/g" k8s-external-ip-deployment.yaml

# Deploy
echo "Deploying to Kubernetes..."
kubectl apply -f k8s-external-ip-deployment.yaml

echo "Deployment initiated!"
echo "Frontend will be available at: http://$FRONTEND_IP"
echo "Backend will be available at: http://$BACKEND_IP:8081"
echo "Use 'kubectl get services' to check status"